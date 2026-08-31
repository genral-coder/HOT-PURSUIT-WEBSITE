import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. A single shared instance avoids exhausting the
 * connection pool during development (where hot-reloading would otherwise
 * create many clients).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Best-effort connectivity check used by /api/health. Never crashes the app. */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
