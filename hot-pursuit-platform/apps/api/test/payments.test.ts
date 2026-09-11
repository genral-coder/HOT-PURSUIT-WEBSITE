import assert from "node:assert/strict";
import { test } from "node:test";
import { env } from "../src/config/env.js";
import { ApiError } from "../src/lib/errors.js";
import {
  getPaymentProvider,
  mockDevModeActive,
  signMockWebhook,
} from "../src/services/payments/providers.js";
import type { PaymentProvider } from "../src/services/payments/providers.js";
import { ORDER_ERROR_CODES } from "../src/services/orders.js";

/**
 * Payment provider tests (no DB required). Covers the dev-only mock adapter:
 * provider resolution (including the production guard) and webhook signature
 * verification/normalization — the security-critical surface of the mock.
 */

const SAVED_PROVIDER = env.paymentProvider;
const SAVED_IS_PROD = env.isProd;
const SAVED_SECRET = env.paymentWebhookSecret;

function withMockProvider<T>(
  fn: (p: PaymentProvider) => T | Promise<T>,
): Promise<T> {
  env.paymentProvider = "mock";
  env.isProd = false;
  env.paymentWebhookSecret = "test-webhook-secret";
  try {
    const { paymentProvider } = getPaymentProvider();
    assert.ok(paymentProvider, "mock provider should be resolvable in dev");
    return Promise.resolve(fn(paymentProvider as PaymentProvider)).finally(() => {
      env.paymentProvider = SAVED_PROVIDER;
      env.isProd = SAVED_IS_PROD;
      env.paymentWebhookSecret = SAVED_SECRET;
    });
  } catch (e) {
    env.paymentProvider = SAVED_PROVIDER;
    env.isProd = SAVED_IS_PROD;
    env.paymentWebhookSecret = SAVED_SECRET;
    throw e;
  }
}

test("empty PAYMENT_PROVIDER resolves to MANUAL (no active provider)", () => {
  env.paymentProvider = "";
  try {
    const { provider, paymentProvider } = getPaymentProvider();
    assert.equal(provider, "MANUAL");
    assert.equal(paymentProvider, null);
  } finally {
    env.paymentProvider = SAVED_PROVIDER;
  }
});

test("mock provider is rejected in production (never ship the simulator)", () => {
  env.paymentProvider = "mock";
  env.isProd = true;
  try {
    assert.throws(() => getPaymentProvider(), /development-only/i);
    assert.equal(mockDevModeActive(), false);
  } finally {
    env.paymentProvider = SAVED_PROVIDER;
    env.isProd = SAVED_IS_PROD;
  }
});

test("signMockWebhook is refused outside mock dev mode", () => {
  env.paymentProvider = "";
  env.isProd = false;
  try {
    assert.throws(() => signMockWebhook("{}"), /only available in mock dev mode/i);
  } finally {
    env.paymentProvider = SAVED_PROVIDER;
    env.isProd = SAVED_IS_PROD;
  }
});

test("mock verifies a valid signed webhook and returns a normalized event", async () => {
  await withMockProvider(async (p) => {
    const payload = JSON.stringify({
      id: "evt_1",
      event: "payment.completed",
      orderNumber: "HP-ABC123",
      amountCents: 1500,
      currency: "USD",
      paymentId: "pay_1",
    });
    const sig = signMockWebhook(payload);
    const event = await p.verifyWebhook(payload, sig);

    assert.equal(event.provider, "MOCK");
    assert.equal(event.eventId, "evt_1");
    assert.equal(event.eventType, "payment.completed");
    assert.equal(event.orderNumber, "HP-ABC123");
    assert.equal(event.amountCents, 1500);
    assert.equal(event.currency, "USD");
    assert.equal(event.paymentId, "pay_1");
  });
});

test("mock rejects a tampered payload with PAYMENT_VERIFICATION_FAILED", async () => {
  await withMockProvider(async (p) => {
    const payload = JSON.stringify({
      id: "evt_1",
      event: "payment.completed",
      orderNumber: "HP-ABC123",
      amountCents: 1500,
    });
    const sig = signMockWebhook(payload);

    const tampered = JSON.stringify({
      ...JSON.parse(payload),
      amountCents: 1,
    });
    await assert.rejects(
      p.verifyWebhook(tampered, sig),
      (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
    );
  });
});

test("mock rejects a payload signed with a different secret", async () => {
  await withMockProvider(async (p) => {
    const payload = JSON.stringify({ id: "evt_2", event: "payment.completed", orderNumber: "HP-XYZ456" });
    const badSig = signMockWebhook(payload).replace(/^sha256=/, "sha256=deadbeef");
    await assert.rejects(
      p.verifyWebhook(payload, badSig),
      (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
    );
  });
});

test("mock rejects malformed JSON and missing required fields", async () => {
  await withMockProvider(async (p) => {
    const payload = "not-json";
    const sig = signMockWebhook(payload);
    await assert.rejects(
      p.verifyWebhook(payload, sig),
      (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
    );

    const missing = JSON.stringify({ id: "evt_3", event: "payment.completed" });
    const sig2 = signMockWebhook(missing);
    await assert.rejects(
      p.verifyWebhook(missing, sig2),
      (e: unknown) => (e as ApiError).code === ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
    );
  });
});

test("mock createCheckoutSession returns a provider order id + dev checkout URL", async () => {
  await withMockProvider(async (p) => {
    const result = await p.createCheckoutSession({
      orderId: "ord_1",
      orderNumber: "HP-ABC123",
      amountCents: 1500,
      currency: "USD",
      userId: "user_1",
      items: [{ productName: "Car Radio", quantity: 1, amountCents: 1500 }],
    });
    assert.ok(result.providerOrderId.startsWith("mock_"));
    assert.match(result.checkoutUrl ?? "", /\/api\/payments\/dev-checkout\?session=/);
  });
});