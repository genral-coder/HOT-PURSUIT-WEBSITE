------ BEGIN: HOT PURSUIT RP — Phase 4 (admin audit log) ------

-- Table: AuditLog
-- Records privileged admin actions traceably. Stores only safe identifiers —
-- never passwords, tokens or secret material.

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUser" TEXT NOT NULL,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetUser" TEXT,
    "targetResource" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Secondary indexes for tracing by actor / action / target / time.
CREATE INDEX "AuditLog_actorUser_idx" ON "AuditLog"("actorUser");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_targetUser_idx" ON "AuditLog"("targetUser");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

------ END: HOT PURSUIT RP — Phase 4 (admin audit log) ------
