import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "../src/lib/errors.js";
import {
  ORDER_ERROR_CODES,
  assertOrderTransition,
  assertPaymentTransition,
  createOrderNumber,
  priceOrderLines,
} from "../src/services/orders.js";
import type { PriceRegistryEntry } from "../src/services/orders.js";

/**
 * Pure order-domain tests (no DB required): order numbers, server-side
 * pricing/totals and controlled status transitions.
 */

const REGISTRY: PriceRegistryEntry[] = [
  { productId: 1, name: "Verified Account", nameAr: "توثيق الحساب", image: null, amountCents: 100, billing: "MONTHLY", available: true },
  { productId: 6, name: "Tropical Heights", nameAr: null, image: null, amountCents: 1000, billing: "MONTHLY", available: false },
  { productId: 28, name: "Car Radio", nameAr: null, image: null, amountCents: 1000, billing: "MONTHLY", available: true },
  { productId: 37, name: "Custom Car Plate", nameAr: null, image: null, amountCents: 500, billing: "ONE_TIME", available: true },
];

test("createOrderNumber returns HP-XXXXXX", () => {
  for (let i = 0; i < 25; i += 1) {
    const n = createOrderNumber();
    assert.match(n, /^HP-[A-Z0-9]{6}$/);
  }
});

test("priceOrderLines computes subtotal and totals across items", () => {
  const { lines, totals } = priceOrderLines(
    [
      { productId: 1, quantity: 1 },
      { productId: 28, quantity: 3 },
      { productId: 37, quantity: 2 },
    ],
    REGISTRY,
  );

  assert.equal(totals.subtotalCents, 100 + 3000 + 1000);
  assert.equal(totals.discountCents, 0);
  assert.equal(totals.totalCents, totals.subtotalCents);

  assert.equal(lines.length, 3);
  assert.equal(lines[0].billing, "MONTHLY");
  assert.equal(lines[2].billing, "ONE_TIME");
  assert.equal(lines[1].unitPriceCents, 1000);
  assert.equal(lines[1].totalCents, 3000);
});

test("priceOrderLines snaps name/image from the registry", () => {
  const { lines } = priceOrderLines([{ productId: 1, quantity: 1 }], REGISTRY);
  assert.equal(lines[0].name, "Verified Account");
  assert.equal(lines[0].nameAr, "توثيق الحساب");
});

test("priceOrderLines rejects an empty cart", () => {
  assert.throws(() => priceOrderLines([], REGISTRY), (e: unknown) => {
    const err = e as ApiError;
    return err.code === "empty_cart";
  });
  assert.throws(() => priceOrderLines(undefined as never, REGISTRY), ApiError);
});

test("priceOrderLines rejects unknown products with PRODUCT_NOT_FOUND", () => {
  assert.throws(
    () => priceOrderLines([{ productId: 9999, quantity: 1 }], REGISTRY),
    (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.PRODUCT_NOT_FOUND,
  );
});

test("priceOrderLines rejects sold-out products with PRODUCT_UNAVAILABLE", () => {
  assert.throws(
    () => priceOrderLines([{ productId: 6, quantity: 1 }], REGISTRY),
    (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.PRODUCT_UNAVAILABLE,
  );
});

test("priceOrderLines rejects invalid quantities with INVALID_QUANTITY", () => {
  for (const qty of [0, -1, 1.5, 26]) {
    assert.throws(
      () => priceOrderLines([{ productId: 1, quantity: qty }], REGISTRY),
      (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.INVALID_QUANTITY,
      `quantity=${qty} should be rejected`,
    );
  }
});

test("priceOrderLines rejects duplicate product lines", () => {
  assert.throws(
    () =>
      priceOrderLines(
        [
          { productId: 1, quantity: 1 },
          { productId: 1, quantity: 2 },
        ],
        REGISTRY,
      ),
    (e: unknown) => (e as ApiError).code === "duplicate_item",
  );
});

test("priceOrderLines rejects a missing product id field", () => {
  assert.throws(
    () => priceOrderLines([{ productId: NaN, quantity: 1 }], REGISTRY),
    (e: unknown) => (e as ApiError).code === "invalid_product_id",
  );
});

test("order status transitions follow the controlled map", () => {
  assert.doesNotThrow(() => assertOrderTransition("PENDING", "PAID"));
  assert.doesNotThrow(() => assertOrderTransition("PAID", "PROCESSING"));
  assert.doesNotThrow(() => assertOrderTransition("PROCESSING", "COMPLETED"));
  assert.doesNotThrow(() => assertOrderTransition("COMPLETED", "REFUNDED"));

  assert.throws(
    () => assertOrderTransition("CANCELLED", "PAID"),
    (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
  );
  assert.throws(
    () => assertOrderTransition("PAID", "PENDING"),
    (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
  );
  assert.throws(
    () => assertOrderTransition("REFUNDED", "COMPLETED"),
    (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
  );
});

test("payment status transitions follow the controlled map", () => {
  assert.doesNotThrow(() => assertPaymentTransition("UNPAID", "PENDING"));
  assert.doesNotThrow(() => assertPaymentTransition("UNPAID", "PAID"));
  assert.doesNotThrow(() => assertPaymentTransition("PENDING", "PAID"));
  assert.doesNotThrow(() => assertPaymentTransition("PAID", "PARTIALLY_REFUNDED"));
  assert.doesNotThrow(() => assertPaymentTransition("PAID", "REFUNDED"));

  assert.throws(
    () => assertPaymentTransition("PAID", "PAID"),
    (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.INVALID_PAYMENT_TRANSITION,
  );
  assert.throws(
    () => assertPaymentTransition("FAILED", "PAID"),
    (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.INVALID_PAYMENT_TRANSITION,
  );
});