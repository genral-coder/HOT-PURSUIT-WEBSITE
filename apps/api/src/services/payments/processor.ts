import type { PaymentProviderType } from "@hotpursuit/types";
import { prisma } from "../../database/client.js";
import { ApiError, isUniqueConstraintError } from "../../lib/errors.js";
import {
  ORDER_ERROR_CODES,
  assertOrderTransition,
  assertPaymentTransition,
} from "../orders.js";
import { recordAudit } from "../audit.js";
import type { NormalizedEvent, PaymentProvider } from "./providers.js";

/**
 * Server-to-server webhook processing.
 *
 * Every webhook event passes through here AFTER the provider verified its
 * signature. Processing is:
 *  1. Idempotent — a duplicate event (same provider + eventId) is a no-op.
 *     The database-level UNIQUE(provider, eventId) constraint is the final
 *     guard against double-processing under concurrency.
 *  2. Trusting — the order is resolved by orderNumber (never from a client),
 *     the paid amount is verified against the stored total when the provider
 *     reports one.
 *  3. Transition-safe — the order/payment only ever moves along the allowed
 *     paths (PENDING → PAID etc.), never by free-form writes.
 *
 * An already-paid order + a "payment.completed" event is treated as
 * idempotent (no-op), never as double charging.
 */

const ACTIVATING_EVENTS = new Set(["payment.completed", "payment.succeeded"]);
const FAILING_EVENTS = new Set(["payment.failed", "payment.cancelled"]);

export async function processPaymentEvent(
  event: NormalizedEvent,
  provider: PaymentProvider,
): Promise<{ orderId: string; action: "applied" | "already_processed" }> {
  const providerType = event.provider as PaymentProviderType;
  const payloadHash = provider.name === "MOCK" ? "mock-simulated" : event.eventId;

  // Idempotency guard #1: this event was already applied in a previous call.
  const existing = await prisma.paymentEvent.findUnique({
    where: { provider_eventId: { provider: providerType, eventId: event.eventId } },
    select: { id: true, processed: true, orderId: true },
  });
  if (existing?.processed) {
    return { orderId: existing.orderId ?? "", action: "already_processed" };
  }

  // Resolve the order by its order number. Unknown orders are rejected — we
  // never create orders from webhook payloads.
  const order = await prisma.order.findFirst({
    where: { orderNumber: event.orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalCents: true,
      currency: true,
    },
  });
  if (!order) {
    throw ApiError.notFound(
      ORDER_ERROR_CODES.ORDER_NOT_FOUND,
      `Order "${event.orderNumber}" was not found.`,
    );
  }

  // Never trust an event blindly: if the gateway reports an amount, it must
  // match what the order is supposed to collect.
  if (
    event.amountCents !== undefined &&
    event.amountCents !== order.totalCents
  ) {
    throw ApiError.conflict(
      ORDER_ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
      `Payment amount mismatch for ${order.orderNumber}: expected ${order.totalCents} ${order.currency}, got ${event.amountCents} ${event.currency ?? order.currency}.`,
    );
  }

  const isPaid = ACTIVATING_EVENTS.has(event.eventType);
  const isFailing = FAILING_EVENTS.has(event.eventType);

  // Unrecognized event types are acknowledged (marked processed) but never
  // change order state.
  if (!isPaid && !isFailing) {
    await markEventProcessed(providerType, event, order.id, payloadHash);
    return { orderId: order.id, action: "already_processed" };
  }

  // Idempotency guard #2: success for an already-paid order is a no-op.
  if (isPaid && order.paymentStatus === "PAID") {
    await markEventProcessed(providerType, event, order.id, payloadHash);
    return { orderId: order.id, action: "already_processed" };
  }

  // Validate the transitions before touching the database (early feedback).
  if (isPaid) {
    assertPaymentTransition(order.paymentStatus, "PAID");
    if (order.status === "PENDING") assertOrderTransition(order.status, "PAID");
  } else {
    // Failed payment: payment moves to FAILED (from UNPAID/PENDING only).
    assertPaymentTransition(order.paymentStatus, "FAILED");
  }

  // Apply atomically: order/payment update + PaymentEvent insert in one
  // transaction. The UNIQUE(provider, eventId) constraint is idempotency
  // guard #3 (a concurrent duplicate hits P2002 and is treated as applied).
  const applied = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isPaid ? "PAID" : "FAILED",
        ...(isPaid && event.paymentId ? { providerPaymentId: event.paymentId } : {}),
        ...(isPaid && order.status === "PENDING" ? { status: "PAID" } : {}),
      },
      select: { id: true, orderNumber: true },
    });

    try {
      await tx.paymentEvent.create({
        data: {
          provider: providerType,
          eventId: event.eventId,
          eventType: event.eventType,
          orderId: updated.id,
          payloadHash,
          processed: true,
          processedAt: new Date(),
        },
      });
    } catch (e) {
      if (isUniqueConstraintError(e)) return false; // duplicate raced us — order already paid
      throw e;
    }

    return true;
  });

  recordAudit({
    actorUser: `system:${providerType}`,
    action: "PAYMENT_WEBHOOK_PROCESSED",
    targetResource: order.id,
    metadata: {
      eventId: event.eventId,
      eventType: event.eventType,
      action: "applied",
    },
  });

  return { orderId: order.id, action: applied ? "applied" : "already_processed" };
}

/** Mark an already-seen/duplicate event as processed (idempotent no-op). */
async function markEventProcessed(
  providerType: PaymentProviderType,
  event: NormalizedEvent,
  orderId: string,
  payloadHash: string,
): Promise<void> {
  await prisma.paymentEvent.upsert({
    where: { provider_eventId: { provider: providerType, eventId: event.eventId } },
    update: { processed: true, processedAt: new Date() },
    create: {
      provider: providerType,
      eventId: event.eventId,
      eventType: event.eventType,
      orderId,
      payloadHash,
      processed: true,
      processedAt: new Date(),
    },
  });
}