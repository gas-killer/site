import "server-only"
import { randomUUID } from "node:crypto"
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { apiKey } from "@/lib/db/schema"
import { mintRouterApiKey, revokeRouterApiKey, RouterRefusedError } from "@/lib/router-admin"

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

/** Where a failed rotation left the old key, so the caller can tell the user whether it still works. */
export class RotationFailedError extends Error {
  constructor(readonly oldKey: "intact" | "revoked" | "unknown", options?: ErrorOptions) {
    super(`API key rotation failed; old key ${oldKey}`, options)
  }
}

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

async function recordKey(tx: Tx, userId: string, created: { id: string; key: string; created_at: number }, expiresAt: Date) {
  const summary = { keyPrefix: created.key.slice(0, 11), createdAt: new Date(created.created_at * 1000), expiresAt }
  await tx.insert(apiKey).values({ id: randomUUID(), userId, routerKeyId: created.id, ...summary })
  return summary
}

export async function issueApiKey(userId: string): Promise<{ key: string; summary: ApiKeySummary }> {
  return db.transaction(async (tx) => {
    if (await lockUserKeys(tx, userId)) throw new ActiveKeyExistsError("An active API key already exists")

    const expiresAt = new Date(Date.now() + API_KEY_LIFETIME_DAYS * 24 * 60 * 60 * 1000)
    const created = await mintRouterApiKey(`user:${userId}`, expiresAt)
    return { key: created.key, summary: await recordKey(tx, userId, created, expiresAt) }
  })
}

/**
 * Replaces the active key with one that expires at the same moment, so rotating never extends access.
 *
 * The router can't join this transaction, so the old key is revoked before commit: a failure then
 * leaves it dead rather than alive behind a dashboard that says it's gone. Rotating again recovers,
 * since revoking an already-revoked key succeeds.
 */
export async function rotateApiKey(userId: string): Promise<{ key: string; summary: ApiKeySummary }> {
  let mintedKeyId: string | undefined
  let oldKey: "intact" | "revoked" | "unknown" = "intact"
  try {
    return await db.transaction(async (tx) => {
      const active = await lockUserKeys(tx, userId)
      if (!active) throw new NoActiveKeyError("No active API key to rotate")

      const created = await mintRouterApiKey(`user:${userId}`, active.expiresAt)
      mintedKeyId = created.id
      const summary = await recordKey(tx, userId, created, active.expiresAt)
      try {
        await revokeRouterApiKey(active.routerKeyId)
      } catch (e) {
        // A timeout may land after the router has already revoked it.
        if (!(e instanceof RouterRefusedError)) oldKey = "unknown"
        throw e
      }
      oldKey = "revoked"
      await tx.update(apiKey).set({ expiresAt: new Date() }).where(eq(apiKey.id, active.id))
      return { key: created.key, summary }
    })
  } catch (e) {
    if (e instanceof NoActiveKeyError) throw e
    // The new key's row rolled back and the user never saw its plaintext, so it must not stay live.
    if (mintedKeyId) {
      const id = mintedKeyId
      await revokeRouterApiKey(id).catch((err) => console.error("orphaned router key", id, err))
    }
    throw new RotationFailedError(oldKey, { cause: e })
  }
}
