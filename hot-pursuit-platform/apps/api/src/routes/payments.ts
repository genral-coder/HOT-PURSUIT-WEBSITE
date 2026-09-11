import { Router } from "express";

// The webhook handler needs the RAW request body to verify the HMAC signature,
// so expose the buffer captured by express.json()'s `verify` hook (see
// server/app.ts).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

import { prisma } from "../database/client.js";
import { ApiError, asyncHandler } from "../lib/errors.js";
import { ORDER_ERROR_CODES } from "../services/orders.js";
import {
  getPaymentProvider,
  mockDevModeActive,
  signMockWebhook,
} from "../services/payments/providers.js";
import { processPaymentEvent } from "../services/payments/processor.js";

export const paymentsRouter = Router();

/**
 * POST /api/payments/webhook
 * Server-to-server endpoint called by payment providers. The signature header
 * is verified by the active provider BEFORE anything is processed, and every
 * event is made idempotent (duplicate deliveries are acknowledged but never
 * re-applied). This is the ONLY path that moves an order to PAID.
 */
paymentsRouter.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const signature = req.header("x-hp-signature");
    if (!signature) {
      throw ApiError.unauthorized(
        ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
        "Missing webhook signature.",
      );
    }

    const { paymentProvider } = getPaymentProvider();
    if (!paymentProvider) {
      throw new ApiError(
        503,
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
        "No payment provider is configured.",
      );
    }

    const payload = (req.rawBody ?? Buffer.from(JSON.stringify(req.body))).toString("utf8");
    const event = await paymentProvider.verifyWebhook(payload, signature);
    const result = await processPaymentEvent(event, paymentProvider);

    res.json({
      received: true,
      orderId: result.orderId,
      processed: result.action === "applied",
      ...(result.action === "already_processed" ? { duplicate: true } : {}),
    });
  }),
);

/**
 * GET /api/payments/dev-checkout?session=...
 *
 * DEVELOPMENT-ONLY mock payment simulator. Only reachable when
 * PAYMENT_PROVIDER=mock and NOT in production. It stands in for the payment
 * gateway "payment page": opening the session URL makes the API emit a
 * SIGNED webhook event (`payment.completed`) to the real
 * POST /api/payments/webhook endpoint so the WHOLE verification pipeline is
 * exercised locally.
 *
 * Nothing is trusted from a frontend callback — the pretend gateway is the
 * server itself, and the webhook still has to pass signature verification and
 * idempotency checks.
 */
paymentsRouter.get(
  "/dev-checkout",
  asyncHandler(async (req, res) => {
    if (!mockDevModeActive()) {
      throw ApiError.notFound("not_found", "Not found.");
    }

    const session = typeof req.query.session === "string" ? req.query.session : "";
    if (!session) {
      throw ApiError.badRequest("invalid_session", "Missing checkout session id.");
    }

    const order = await prisma.order.findFirst({
      where: { providerOrderId: session },
      select: {
        id: true,
        orderNumber: true,
        totalCents: true,
        currency: true,
        paymentStatus: true,
        status: true,
      },
    });
    if (!order) {
      throw ApiError.notFound(
        ORDER_ERROR_CODES.ORDER_NOT_FOUND,
        "Checkout session not found.",
      );
    }

    const { paymentProvider } = getPaymentProvider();
    if (!paymentProvider || paymentProvider.name !== "MOCK") {
      throw ApiError.notFound("not_found", "Not found.");
    }

    let outcome: { ok: boolean; message: string; paid: boolean };
    if (order.paymentStatus === "PAID") {
      outcome = {
        ok: true,
        message: "This order was already paid (duplicate payment attempt is ignored).",
        paid: true,
      };
    } else {
      // Simulate the gateway delivering a completed-payment webhook.
      const payload = JSON.stringify({
        id: `evt_mock_${order.id}_${Date.now().toString(36)}`,
        event: "payment.completed",
        orderNumber: order.orderNumber,
        amountCents: order.totalCents,
        currency: order.currency,
        paymentId: `pay_${session}`,
      });
      const signature = signMockWebhook(payload);
      const res2 = await fetch(
        `${process.env.API_BASE_URL ?? "http://localhost:4000"}/api/payments/webhook`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-hp-signature": signature,
          },
          body: payload,
        },
      );
      const body = (await res2.json().catch(() => ({}))) as {
        received?: boolean;
        processed?: boolean;
      };
      outcome = {
        ok: res2.ok && body.received === true,
        message:
          body.processed === true
            ? "Mock payment completed and the order was marked PAID via the verified webhook."
            : "Mock payment completed but the event was already processed (idempotent no-op).",
        paid: true,
      };
    }

    // Dev-only diagnostic page (not part of the user-facing app UI).
    res.status(outcome.ok ? 200 : 502).set("content-type", "text/html; charset=utf-8").send(
      [
        "<!doctype html><html><head><meta charset='utf-8'><title>Mock payment</title></head><body>",
        "<h1>HOT PURSUIT RP — mock payment (development only)</h1>",
        `<p>Order <strong>${escapeHtml(order.orderNumber)}</strong> · ` +
          `${(order.totalCents / 100).toFixed(2)} ${escapeHtml(order.currency)}</p>`,
        `<p>${escapeHtml(outcome.message)}</p>`,
        outcome.ok
          ? "<p><a href='javascript:window.close()'>Close</a></p>"
          : "<p>Something went wrong during the simulated checkout.</p>",
        "</body></html>",
      ].join(""),
    );
  }),
);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}