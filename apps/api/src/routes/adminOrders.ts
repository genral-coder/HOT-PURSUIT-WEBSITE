import { Router } from "express";
import type { OrderStatus, PaymentStatus, PaymentProviderType } from "@hotpursuit/types";
import { prisma } from "../database/client.js";
import { ApiError, asyncHandler } from "../lib/errors.js";
import { requireAuth, requirePermission, type AuthPrincipal } from "../middleware/auth.js";
import {
  assertOrderTransition,
  assertPaymentTransition,
} from "../services/orders.js";
import { ORDER_ERROR_CODES } from "../services/orders.js";
import { recordAudit } from "../services/audit.js";

export const adminOrdersRouter = Router();

// Every admin orders route requires an authenticated user; granular
// permissions are enforced per-endpoint.
adminOrdersRouter.use(requireAuth);

/**
 * GET /api/admin/orders?search=&status=&paymentStatus=&provider=&page=&limit=
 * List orders with server-enforced filtering. `orders.view` required.
 */
adminOrdersRouter.get(
  "/",
  requirePermission("orders.view"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, positiveInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, positiveInt(req.query.limit, 20)));

    const where: Record<string, unknown> = {};
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      where.OR = [
        { orderNumber: { contains: search.toUpperCase(), mode: "insensitive" } },
        { user: { discordAccount: { username: { contains: search, mode: "insensitive" } } } },
      ];
    }
    if (isOrderStatus(req.query.status)) where.status = req.query.status;
    if (isPaymentStatus(req.query.paymentStatus)) where.paymentStatus = req.query.paymentStatus;
    if (isProvider(req.query.provider)) where.provider = req.query.provider;

    const [rows, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.order.count({ where }),
    ]);

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
      total,
      page,
      limit,
    });
  }),
);

/**
 * GET /api/admin/orders/:id
 * Full order detail (with items) + owning user identity. `orders.view`.
 */
adminOrdersRouter.get(
  "/:id",
  requirePermission("orders.view"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const row = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { include: { discordAccount: true } },
      },
    });
    if (!row) {
      throw ApiError.notFound(ORDER_ERROR_CODES.ORDER_NOT_FOUND, "Order not found.");
    }

    res.json({
      order: {
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
        items: row.items.map((i) => ({
          id: i.id,
          orderId: i.orderId,
          productId: i.productId,
          productName: i.productName,
          productNameAr: i.productNameAr,
          productImage: i.productImage,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
          totalCents: i.totalCents,
          billing: i.billing,
        })),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        user: {
          id: row.user.id,
          discordUsername: row.user.discordAccount?.username ?? "",
          discordGlobalName: row.user.discordAccount?.globalName ?? null,
        },
      },
    });
  }),
);

/**
 * PATCH /api/admin/orders/:id/status
 * Move an order to a target order status and/or payment status. Only allowed
 * transitions are accepted (server-side controlled — never free-form writes).
 * `orders.manage` required; every change is audit-logged.
 *
 * Body: { status?: OrderStatus, paymentStatus?: PaymentStatus }
 */
adminOrdersRouter.patch(
  "/:id/status",
  requirePermission("orders.manage"),
  asyncHandler(async (req, res) => {
    const principal = req.authUser as AuthPrincipal;
    const id = String(req.params.id);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const row = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true },
    });
    if (!row) {
      throw ApiError.notFound(ORDER_ERROR_CODES.ORDER_NOT_FOUND, "Order not found.");
    }

    const changes: { from: string; to: string; field: string }[] = [];

    if (body.status !== undefined) {
      const target = body.status as unknown;
      if (!isOrderStatus(target)) {
        throw ApiError.badRequest("invalid_status", "Invalid order status.");
      }
      if (target !== row.status) {
        assertOrderTransition(row.status, target);
        changes.push({ field: "status", from: row.status, to: target });
      }
    }

    if (body.paymentStatus !== undefined) {
      const target = body.paymentStatus as unknown;
      if (!isPaymentStatus(target)) {
        throw ApiError.badRequest("invalid_payment_status", "Invalid payment status.");
      }
      if (target !== row.paymentStatus) {
        assertPaymentTransition(row.paymentStatus, target);
        changes.push({ field: "paymentStatus", from: row.paymentStatus, to: target });
      }
    }

    if (changes.length === 0) {
      res.json({ ok: true, changed: [], order: row });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(changes.find((c) => c.field === "status")
          ? { status: changes.find((c) => c.field === "status")!.to as OrderStatus }
          : {}),
        ...(changes.find((c) => c.field === "paymentStatus")
          ? {
              paymentStatus: changes
                .find((c) => c.field === "paymentStatus")!
                .to as PaymentStatus,
            }
          : {}),
      },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true },
    });

    void recordAudit({
      actorUser: principal.userId,
      actorRole: principal.access.roles[0] ?? null,
      action: "ORDER_STATUS_UPDATED",
      targetResource: id,
      metadata: { changes },
    });

    res.json({ ok: true, changed: changes, order: updated });
  }),
);

/* ───────────────────────────── guards ───────────────────────────── */

function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function isOrderStatus(v: unknown): v is OrderStatus {
  return (
    typeof v === "string" &&
    ["PENDING", "PAID", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"].includes(v)
  );
}

function isPaymentStatus(v: unknown): v is PaymentStatus {
  return (
    typeof v === "string" &&
    ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(v)
  );
}

function isProvider(v: unknown): v is PaymentProviderType {
  return (
    typeof v === "string" &&
    ["MANUAL", "MOCK", "STRIPE", "PAYPAL", "TEBEX"].includes(v)
  );
}