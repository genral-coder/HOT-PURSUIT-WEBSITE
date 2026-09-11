import { randomBytes } from "node:crypto";
import type { Billing, CheckoutItem, OrderStatus, PaymentStatus } from "@hotpursuit/types";
import { ApiError } from "../lib/errors.js";

/**
 * Pure order-domain logic (no DB access). Everything here is unit-testable
 * without a database:
 *   - order number generation
 *   - server-side pricing/totals (the client NEVER supplies prices or totals)
 *   - controlled status/payment transitions (never free-form writes)
 */

/** Stable, client-safe error codes for the orders/payments domain. */
export const ORDER_ERROR_CODES = {
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  UNAUTHORIZED_ORDER: "UNAUTHORIZED_ORDER",
  PAYMENT_CREATION_FAILED: "PAYMENT_CREATION_FAILED",
  PAYMENT_VERIFICATION_FAILED: "PAYMENT_VERIFICATION_FAILED",
  PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED",
  ORDER_ALREADY_PAID: "ORDER_ALREADY_PAID",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  INVALID_PAYMENT_TRANSITION: "INVALID_PAYMENT_TRANSITION",
} as const;

export const MAX_ORDER_ITEM_QUANTITY = 25;

/** A row of the trusted server-side price registry (mirrors Prisma ProductPrice). */
export interface PriceRegistryEntry {
  productId: number;
  name: string;
  nameAr: string | null;
  image: string | null;
  amountCents: number;
  billing: Billing;
  available: boolean;
}

/** A resolved, priced order line ready to be snapshotted into an OrderItem. */
export interface PricedLine {
  productId: number;
  name: string;
  nameAr: string | null;
  image: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  billing: Billing;
}

export interface OrderTotals {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

/** Generate a human-friendly order number, e.g. "HP-A1B2C3". */
export function createOrderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"; // no ambiguous I/O
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `HP-${out}`;
}

function validateQuantity(productId: number, quantity: number): void {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_ORDER_ITEM_QUANTITY
  ) {
    throw ApiError.badRequest(
      ORDER_ERROR_CODES.INVALID_QUANTITY,
      `Quantity for product ${productId} must be between 1 and ${MAX_ORDER_ITEM_QUANTITY}.`,
    );
  }
}

/**
 * Resolve untrusted checkout lines against the trusted price registry and
 * compute the authoritative totals. Throws on unknown/sold-out products or
 * invalid quantities. `discountCents` is a structured 0 now (reserved for a
 * future discount layer) — the flow never fabricates discounts.
 */
export function priceOrderLines(
  items: CheckoutItem[],
  registry: PriceRegistryEntry[],
): { lines: PricedLine[]; totals: OrderTotals } {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("empty_cart", "The order is empty.");
  }

  const byId = new Map<number, PriceRegistryEntry>();
  for (const r of registry) byId.set(r.productId, r);

  const seen = new Set<number>();
  const lines: PricedLine[] = [];
  let subtotal = 0;

  for (const item of items) {
    if (typeof item?.productId !== "number" || !Number.isInteger(item.productId)) {
      throw ApiError.badRequest("invalid_product_id", "Invalid product id.");
    }
    validateQuantity(item.productId, item.quantity);

    if (seen.has(item.productId)) {
      throw ApiError.badRequest(
        "duplicate_item",
        `Product ${item.productId} is repeated in the cart.`,
      );
    }
    seen.add(item.productId);

    const entry = byId.get(item.productId);
    if (!entry) {
      throw ApiError.notFound(
        ORDER_ERROR_CODES.PRODUCT_NOT_FOUND,
        `Product ${item.productId} is not available for purchase.`,
      );
    }
    if (!entry.available) {
      throw ApiError.conflict(
        ORDER_ERROR_CODES.PRODUCT_UNAVAILABLE,
        `Product ${entry.name} is currently sold out.`,
      );
    }

    const totalCents = entry.amountCents * item.quantity;
    subtotal += totalCents;
    lines.push({
      productId: entry.productId,
      name: entry.name,
      nameAr: entry.nameAr,
      image: entry.image,
      quantity: item.quantity,
      unitPriceCents: entry.amountCents,
      totalCents,
      billing: entry.billing,
    });
  }

  const totals: OrderTotals = {
    subtotalCents: subtotal,
    discountCents: 0,
    totalCents: subtotal,
  };

  return { lines, totals };
}

/** Allowed order status transitions. Any other pair is a server-side error. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED", "FAILED"],
  PAID: ["PROCESSING", "REFUNDED", "CANCELLED"],
  PROCESSING: ["COMPLETED", "REFUNDED", "FAILED"],
  COMPLETED: ["REFUNDED"],
  FAILED: ["PENDING", "CANCELLED"],
  CANCELLED: [],
  REFUNDED: [],
};

/** Assert a controlled order status transition, throwing otherwise. */
export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!ORDER_TRANSITIONS[from]?.includes(to)) {
    throw ApiError.conflict(
      ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Cannot move an order from "${from}" to "${to}".`,
    );
  }
}

/** Allowed payment status transitions. */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  // UNPAID → PAID is the common path: an order created without a payment
  // attempt can be paid directly by a completed webhook.
  UNPAID: ["PENDING", "PAID", "FAILED"],
  PENDING: ["PAID", "FAILED", "REFUNDED"],
  PAID: ["REFUNDED", "PARTIALLY_REFUNDED"],
  FAILED: ["PENDING"],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
};

/** Assert a controlled payment status transition, throwing otherwise. */
export function assertPaymentTransition(
  from: PaymentStatus,
  to: PaymentStatus,
): void {
  if (!PAYMENT_TRANSITIONS[from]?.includes(to)) {
    throw ApiError.conflict(
      ORDER_ERROR_CODES.INVALID_PAYMENT_TRANSITION,
      `Cannot move payment from "${from}" to "${to}".`,
    );
  }
}