import type { AuditAction } from "@hotpursuit/types";
import { prisma } from "../database/client.js";

/**
 * Append an entry to the audit log. Only safe identifiers are recorded — never
 * secrets, tokens or passwords.
 *
 * Writes fail gracefully: if the database is unavailable the action still
 * completes and the error is swallowed (the primary admin action is what
 * matters; tracing is best-effort on an unavailable DB). Callers pass already-
 * validated, raw-safe values.
 */
export async function recordAudit(input: {
  actorUser: string;
  actorRole?: string | null;
  action: AuditAction;
  targetUser?: string | null;
  targetResource?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUser: input.actorUser,
        actorRole: input.actorRole ?? null,
        action: input.action,
        targetUser: input.targetUser ?? null,
        targetResource: input.targetResource ?? null,
        metadata: (input.metadata as object) ?? undefined,
      },
    });
  } catch {
    // Best-effort: never let an audit write break the primary admin action.
  }
}
