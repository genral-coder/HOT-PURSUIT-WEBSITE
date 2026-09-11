import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProviderType } from "@hotpursuit/types";
import { env } from "../../config/env.js";
import { ApiError } from "../../lib/errors.js";
import { ORDER_ERROR_CODES } from "../orders.js";

/**
 * Payment provider abstraction.
 *
 * A provider owns the external payment flow: creation of a checkout session,
 * verification of server-to-server webhook notifications and (optionally)
 * querying gateway-side payment status.
 *
 * ONLY ONE implementation exists today: `MockPaymentProvider`, a
 * DEVELOPMENT-ONLY simulator (see below). Real Stripe/PayPal/Tebex adapters
 * implement the same interface when credentials are configured — nothing is
 * faked here.
 */

export interface CreateCheckoutInput {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  userId: string;
  items: Array<{ productName: string; quantity: number; amountCents: number }>;
}

export interface CheckoutResult {
  /** Provider-side order/checkout reference. Stored as Order.providerOrderId. */
  providerOrderId: string;
  /** Where the user continues payment. null only when the checkout is manual. */
  checkoutUrl: string | null;
}

/** Server-to-server payment event after verification (tamper-safe). */
export interface NormalizedEvent {
  provider: PaymentProviderType;
  eventId: string;
  /** e.g. "payment.completed" | "payment.failed" */
  eventType: string;
  /** Order number carried in the event metadata. */
  orderNumber: string;
  paymentId?: string;
  /** Amount the gateway charged, in cents — verified against the order. */
  amountCents?: number;
  currency?: string;
}

export type PaymentStatusResult =
  | "paid"
  | "unpaid"
  | "pending"
  | "failed"
  | "refunded";

export interface PaymentProvider {
  readonly name: PaymentProviderType;
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult>;
  /**
   * Verify the signature on a raw webhook payload and return a normalized
   * event. Throws ApiError(PAYMENT_VERIFICATION_FAILED) on any failure.
   */
  verifyWebhook(payload: string, signature: string): Promise<NormalizedEvent>;
  /** Query gateway-side payment status (used for reconciliation). */
  getPaymentStatus(providerPurchaseId: string): Promise<PaymentStatusResult>;
}

/* ───────────────────────────── Mock (dev-only) ───────────────────────────── */

/**
 * Development-only payment simulator. It exercises the FULL real pipeline:
 *  1. createCheckoutSession() returns a dev "pay" URL (session id).
 *  2. Opening that URL makes the API emit a SIGNED webhook event (HMAC-SHA256)
 *     to the real POST /api/payments/webhook endpoint.
 *  3. The regular webhook pipeline verifies the signature, enforces
 *     idempotency and marks the order PAID.
 *
 * NOTHING is trusted from a frontend callback. The mock MUST never be enabled
 * in production and is rejected loudly if someone tries.
 *
 * The signing secret is `PAYMENT_WEBHOOK_SECRET` when set; otherwise a
 * static, clearly-non-secret dev value is used (fine, because the mock itself
 * cannot run in production).
 */
const MOCK_FALLBACK_SECRET = "mock-payment-provider-dev-only-not-a-real-secret";

const SIGNATURE_PREFIX = "sha256=";

function sign(payload: string, secret: string): string {
  return SIGNATURE_PREFIX + createHmac("sha256", secret).update(payload).digest("hex");
}

function isValidSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature.startsWith(SIGNATURE_PREFIX)) return false;
  const expected = Buffer.from(sign(payload, secret).slice(SIGNATURE_PREFIX.length), "hex");
  const provided = Buffer.from(signature.slice(SIGNATURE_PREFIX.length), "hex");
  if (expected.length !== provided.length || expected.length === 0) return false;
  return timingSafeEqual(expected, provided);
}

class MockPaymentProvider implements PaymentProvider {
  readonly name = "MOCK" as const;

  private get secret(): string {
    return env.paymentWebhookSecret?.trim() || MOCK_FALLBACK_SECRET;
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
    if (env.isProd) {
      throw new Error("MockPaymentProvider is development-only.");
    }
    const sessionId = `mock_${input.orderId}_${Date.now().toString(36)}`;
    // The dev checkout URL points at the API's own base URL so the session can
    // be resolved server-side. Session identity = providerOrderId (stored on
    // the Order), so the endpoint needs no extra state.
    return {
      providerOrderId: sessionId,
      checkoutUrl: `${env.apiBaseUrl}/api/payments/dev-checkout?session=${encodeURIComponent(sessionId)}`,
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<NormalizedEvent> {
    if (!isValidSignature(payload, signature, this.secret)) {
      throw ApiError.unauthorized(
        ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
        "Invalid webhook signature.",
      );
    }

    let raw: unknown;
    try {
      raw = JSON.parse(payload);
    } catch {
      throw ApiError.badRequest(
        ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
        "Malformed webhook payload.",
      );
    }

    const body = raw as Record<string, unknown>;
    const eventId = typeof body.id === "string" ? body.id : "";
    const eventType = typeof body.event === "string" ? body.event : "";
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber : "";
    if (!eventId || !eventType || !orderNumber) {
      throw ApiError.badRequest(
        ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
        "Webhook payload is missing required fields.",
      );
    }

    const paymentId = typeof body.paymentId === "string" ? body.paymentId : undefined;
    const amountCents =
      typeof body.amountCents === "number" && Number.isInteger(body.amountCents)
        ? body.amountCents
        : undefined;
    const currency = typeof body.currency === "string" ? body.currency : undefined;

    return {
      provider: this.name,
      eventId,
      eventType,
      orderNumber,
      ...(paymentId ? { paymentId } : {}),
      ...(amountCents !== undefined ? { amountCents } : {}),
      ...(currency ? { currency } : {}),
    };
  }

  async getPaymentStatus(_providerPurchaseId: string): Promise<PaymentStatusResult> {
    // The simulator has no persistent gateway state; status is tracked on the
    // Order itself (webhook-driven). Real providers query their own API here.
    return "pending";
  }
}

/* ───────────────────────────── Registry ───────────────────────────── */

const MOCK = new MockPaymentProvider();

/**
 * Resolve the configured provider, or null for MANUAL (no provider).
 *
 * - "" (unset)        → null (MANUAL — legacy Discord-ticket flow).
 * - "mock"            → dev simulator; HARD-errors in production.
 * - stripe/paypal/tebex → not wired yet; honest 503, nothing faked.
 * - anything else     → configuration error.
 */
export function getPaymentProvider(): {
  provider: PaymentProviderType;
  paymentProvider: PaymentProvider | null;
} {
  const name = env.paymentProvider.trim().toLowerCase();

  if (!name) {
    return { provider: "MANUAL", paymentProvider: null };
  }

  if (name === "mock") {
    if (env.isProd) {
      throw new Error(
        "Refusing to boot: PAYMENT_PROVIDER=mock is development-only and must never be enabled in production.",
      );
    }
    return { provider: "MOCK", paymentProvider: MOCK };
  }

  if (name === "stripe" || name === "paypal" || name === "tebex") {
    throw new ApiError(
      503,
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      `Payment provider "${name}" is not wired up yet. No real credentials are configured and nothing is fabricated.`,
    );
  }

  throw new Error(`Unknown PAYMENT_PROVIDER "${name}".`);
}

/** True when the dev-only mock simulator is active and safe to expose. */
export function mockDevModeActive(): boolean {
  return !env.isProd && env.paymentProvider.trim().toLowerCase() === "mock";
}

/**
 * Sign a payload the way the mock simulator would (only valid while the mock
 * is active — the dev "gateway" page uses this to emit its own webhook).
 */
export function signMockWebhook(payload: string): string {
  if (!mockDevModeActive()) {
    throw new Error("signMockWebhook is only available in mock dev mode.");
  }
  const secret = env.paymentWebhookSecret?.trim() || MOCK_FALLBACK_SECRET;
  return sign(payload, secret);
}