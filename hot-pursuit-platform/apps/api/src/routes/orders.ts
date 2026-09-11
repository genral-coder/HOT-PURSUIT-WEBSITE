import { Router } from "express";
import type {
  Billing,
  CheckoutItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  PaymentProviderType,
} from "@hotpursuit/types";
import { prisma } from "../database/client.js";
import { ApiError, asyncHandler, isUniqueConstraintError } from "../lib/errors.js";
import { requireAuth, type AuthPrincipal } from "../middleware/auth.js";
import { ORDER_ERROR_CODES, createOrderNumber, priceOrderLines } from "../services/orders.js";
import type { PricedLine, OrderTotals } from "../services/orders.js";
import { getPaymentProvider } from "../services/payments/providers.js";

export const ordersRouter = Router();

// All order endpoints require an authenticated user. Identity and ownership
// are resolved server-side from the session — never from client fields.
ordersRouter.use(requireAuth);

/**
 * POST /api/orders
 * Create an order (and, when a payment provider is configured, its checkout
 * session). The client sends ONLY product ids + quantities; every price,
 * total and availability check is done server-side against the trusted
 * ProductPrice registry.
 *
 * Response shape: { order, checkoutUrl, provider }.
 * - checkoutUrl = URL to redirect the buyer to for payment (null when the
 *   payment provider is not configured — fall back to the legacy Discord
 *   ticket flow; the order is recorded as MANUAL and NOT marked paid).
 * - order.status starts PENDING / paymentStatus UNPAID. It becomes PAID ONLY
 *   through a verified server-to-server webhook event.
 */
ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;

    const items = (req.body as { items?: unknown }).items as CheckoutItem[] | undefined;
    const registry = await prisma.productPrice.findMany();
    const { lines, totals } = priceOrderLines(items ?? [], registry);

    // Resolve the payment backend. MANUAL (no provider) is a valid, honest
    // mode; mock-in-production and unwired providers are hard errors.
    const { provider, paymentProvider } = getPaymentProvider();

    const order = await createOrderRecord(
      principal.userId,
      lines,
      totals,
      provider,
    );

    let checkoutUrl: string | null = null;
    if (paymentProvider) {
      try {
        const session = await paymentProvider.createCheckoutSession({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amountCents: order.totalCents,
          currency: order.currency,
          userId: principal.userId,
          items: lines.map((l) => ({
            productName: l.name,
            quantity: l.quantity,
            amountCents: l.totalCents,
          })),
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { providerOrderId: session.providerOrderId },
        });
        checkoutUrl = session.checkoutUrl;
      } catch {
        // The order is persisted and visible; only the payment session failed.
        throw ApiError.badRequest(
          ORDER_ERROR_CODES.PAYMENT_CREATION_FAILED,
          "Unable to create the payment session. Please try again.",
        );
      }
    }

    res.status(201).json({
      order: serializeOrder(order),
      checkoutUrl,
      provider,
    });
  }),
);

/**
 * GET /api/orders
 * List the authenticated user's own orders (newest first).
 */
ordersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const rows = await prisma.order.findMany({
      where: { userId: principal.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        currency: true,
        totalCents: true,
        provider: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
    });
    res.json({
      orders: rows.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        status: r.status,
        paymentStatus: r.paymentStatus,
        currency: r.currency,
        totalCents: r.totalCents,
        itemCount: r.items.reduce((n, i) => n + i.quantity, 0),
        provider: r.provider,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  }),
);

/**
 * GET /api/orders/:id
 * Order detail. Users see only their own orders; staff with `orders.view`
 * may inspect any order (their real authorization is still server-enforced).
 */
ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const id = String(req.params.id);

    const row = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!row) {
      throw ApiError.notFound(ORDER_ERROR_CODES.ORDER_NOT_FOUND, "Order not found.");
    }

    const canViewAll = principal.access.permissions.includes("orders.view");
    if (row.userId !== principal.userId && !canViewAll) {
      throw ApiError.forbidden(
        ORDER_ERROR_CODES.UNAUTHORIZED_ORDER,
        "This order belongs to another user.",
      );
    }

    res.json({ order: serializeOrder(row) });
  }),
);

/* ───────────────────────────── helpers ───────────────────────────── */

async function createOrderRecord(
  userId: string,
  lines: PricedLine[],
  totals: OrderTotals,
  provider: PaymentProviderType,
) {
  // The order number is the human-facing identity; retry on the (rare) unique
  // collision. The UNIQUE constraint is the final guarantee.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = createOrderNumber();
    try {
      return await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            status: "PENDING",
            paymentStatus: "UNPAID",
            currency: "USD",
            subtotalCents: totals.subtotalCents,
            discountCents: totals.discountCents,
            totalCents: totals.totalCents,
            provider,
            items: {
              create: lines.map((l) => ({
                productId: l.productId,
                productName: l.name,
                productNameAr: l.nameAr,
                productImage: l.image,
                quantity: l.quantity,
                unitPriceCents: l.unitPriceCents,
                totalCents: l.totalCents,
                billing: l.billing,
              })),
            },
          },
          include: { items: true },
        });
        return order;
      });
    } catch (e) {
      if (isUniqueConstraintError(e)) continue;
      throw e;
    }
  }
  throw new Error("Unable to allocate a unique order number.");
}

function serializeOrder(row: {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  provider: PaymentProviderType;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    productId: number;
    productName: string;
    productNameAr: string | null;
    productImage: string | null;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    billing: Billing;
  }>;
}): Order {
  const items: OrderItem[] = (row.items ?? []).map((i) => ({
    id: i.id,
    orderId: row.id,
    productId: i.productId,
    productName: i.productName,
    productNameAr: i.productNameAr,
    productImage: i.productImage,
    quantity: i.quantity,
    unitPriceCents: i.unitPriceCents,
    totalCents: i.totalCents,
    billing: i.billing,
  }));
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    status: row.status,
    paymentStatus: row.paymentStatus,
    currency: row.currency,
    subtotalCents: row.subtotalCents,
    discountCents: row.discountCents,
    totalCents: row.totalCents,
    provider: row.provider,
    providerOrderId: row.providerOrderId,
    providerPaymentId: row.providerPaymentId,
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}