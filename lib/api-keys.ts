import "server-only"
import { randomUUID } from "node:crypto"
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { apiKey } from "@/lib/db/schema"
import { mintRouterApiKey, revokeRouterApiKey } from "@/lib/router-admin"

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
    // Router timestamps are whole seconds, so a key and its rotation can tie; the replacement expires later.
    .orderBy(desc(apiKey.createdAt), desc(apiKey.expiresAt))
    .limit(1)
  return row ?? null
}

export class ActiveKeyExistsError extends Error {}
export class NoActiveKeyError extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// Serializes key changes per user so a double-click can't leave two active keys.
async function lockUserKeys(tx: Tx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)
  const [active] = await tx
    .select({ id: apiKey.id, routerKeyId: apiKey.routerKeyId, expiresAt: apiKey.expiresAt })
    .from(apiKey)
    .where(and(eq(apiKey.userId, userId), gt(apiKey.expiresAt, new Date())))
    .limit(1)
  return active
}

async function mintAndRecord(tx: Tx, userId: string, expiresAt: Date) {
  const created = await mintRouterApiKey(`user:${userId}`, expiresAt)
  const summary = { keyPrefix: created.key.slice(0, 11), createdAt: new Date(created.created_at * 1000), expiresAt }
  await tx.insert(apiKey).values({ id: randomUUID(), userId, routerKeyId: created.id, ...summary })
  return { key: created.key, routerKeyId: created.id, summary }
}

export async function issueApiKey(userId: string): Promise<{ key: string; summary: ApiKeySummary }> {
  return db.transaction(async (tx) => {
    if (await lockUserKeys(tx, userId)) throw new ActiveKeyExistsError("An active API key already exists")

    const expiresAt = new Date(Date.now() + API_KEY_LIFETIME_DAYS * 24 * 60 * 60 * 1000)
    const { key, summary } = await mintAndRecord(tx, userId, expiresAt)
    return { key, summary }
  })
}

/** Replaces the active key with one that expires at the same moment, so rotating never extends access. */
export async function rotateApiKey(userId: string): Promise<{ key: string; summary: ApiKeySummary }> {
  return db.transaction(async (tx) => {
    const active = await lockUserKeys(tx, userId)
    if (!active) throw new NoActiveKeyError("No active API key to rotate")

    const { key, routerKeyId, summary } = await mintAndRecord(tx, userId, active.expiresAt)
    try {
      await revokeRouterApiKey(active.routerKeyId)
    } catch (e) {
      // The transaction rolls back, so the new key must not outlive it on the router either.
      await revokeRouterApiKey(routerKeyId).catch((err) => console.error("orphaned router key", routerKeyId, err))
      throw e
    }
    await tx.update(apiKey).set({ expiresAt: new Date() }).where(eq(apiKey.id, active.id))
    return { key, summary }
  })
}
