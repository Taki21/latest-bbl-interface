import { PrismaClient } from "@prisma/client";

/**
 * -----------------------------------------------------------------------------
 *  Prisma singleton + helpers
 *  Place this file in /lib (e.g. `lib/prisma.ts`) so you can import via
 *    import { prisma, safeJson } from "@/lib/prisma";
 *
 *  Benefits:
 *  • Avoids creating multiple DB connections during Next.js dev hot‑reloads
 *  • Centralizes bigint‑safe JSON serialization
 * -----------------------------------------------------------------------------
 */

// ─── Singleton instance (works in Next.js App Router + Edge‑disabled routes) ───
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma; // cache the instance in development
}

// ─── Helper: safely serialize bigint values for JSON responses ────────────────
export function safeJson<T extends Record<string, any>>(obj: T) {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  ) as T;
}
