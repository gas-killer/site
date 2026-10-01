import "server-only"
import { randomUUID } from "node:crypto"
import { and, count, eq, gt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { lifeRun } from "@/lib/db/schema"

export const RUNS_PER_HOUR = 5

/** Counts the attempt against the user's hourly quota, or returns null when it's used up. */
export async function reserveRun(userId: string): Promise<string | null> {
  return db.transaction(async (tx) => {
    // Serializes a user's concurrent clicks so they can't all pass the count together.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`life:${userId}`}))`)
    const [{ runs }] = await tx
      .select({ runs: count() })
      .from(lifeRun)
      .where(and(eq(lifeRun.userId, userId), gt(lifeRun.createdAt, new Date(Date.now() - 3_600_000))))
    if (runs >= RUNS_PER_HOUR) return null
    const id = randomUUID()
    await tx.insert(lifeRun).values({ id, userId })
    return id
  })
}

/** Hands back a reserved run that failed before costing anything, so transient errors don't use up the quota. */
export async function releaseRun(runId: string): Promise<void> {
  await db.delete(lifeRun).where(eq(lifeRun.id, runId))
}

export async function recordSettlement(runId: string, txHash: string): Promise<void> {
  await db.update(lifeRun).set({ txHash }).where(eq(lifeRun.id, runId))
}
