import "server-only"
import { randomUUID } from "node:crypto"
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { apiKey } from "@/lib/db/schema"
import { mintRouterApiKey } from "@/lib/router-admin"

export const API_KEY_LIFETIME_DAYS = 30

export type ApiKeySummary = {
  keyPrefix: string
  createdAt: Date
  expiresAt: Date
}

export async function getLatestApiKey(userId: string): Promise<ApiKeySummary | null> {
  const [row] = await db
    .select({ keyPrefix: apiKey.keyPrefix, createdAt: apiKey.createdAt, expiresAt: apiKey.expiresAt })
    .from(apiKey)
    .where(eq(apiKey.userId, userId))
    .orderBy(desc(apiKey.createdAt))
    .limit(1)
  return row ?? null
}

export class ActiveKeyExistsError extends Error {}

export async function issueApiKey(userId: string): Promise<{ key: string; summary: ApiKeySummary }> {
  return db.transaction(async (tx) => {
    // Serializes concurrent requests per user so a double-click can't mint two active keys.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)

    const [active] = await tx
      .select({ id: apiKey.id })
      .from(apiKey)
      .where(and(eq(apiKey.userId, userId), gt(apiKey.expiresAt, new Date())))
      .limit(1)
    if (active) throw new ActiveKeyExistsError("An active API key already exists")

    const expiresAt = new Date(Date.now() + API_KEY_LIFETIME_DAYS * 24 * 60 * 60 * 1000)
    const created = await mintRouterApiKey(`user:${userId}`, expiresAt)

    const summary = { keyPrefix: created.key.slice(0, 11), createdAt: new Date(created.created_at * 1000), expiresAt }
    await tx.insert(apiKey).values({ id: randomUUID(), userId, routerKeyId: created.id, ...summary })
    return { key: created.key, summary }
  })
}
