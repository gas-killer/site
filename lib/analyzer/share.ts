import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { NETWORKS } from "@/lib/networks"

/** The figures a share link shows, as the analyzer produced them. */
export interface SharedResult {
  network: string
  hash: string
  gasUsed: number
  // With Gas Killer, signature verification included.
  estimate: number
  // Wei, as a decimal string.
  gasPrice: string
  nested: boolean
}

// The link carries the figures themselves, signed, so the share page needs no storage and can't be made
// to show savings the analyzer never reported.
const HASH = /^[0-9a-f]{64}$/
const GAS = /^\d{1,15}$/
const WEI = /^\d{1,30}$/
// 128 bits is plenty against forgery and keeps the link short.
const SIG_BYTES = 16

export function signShare(r: SharedResult): string {
  const body = [r.network, r.hash.slice(2).toLowerCase(), r.gasUsed, r.estimate, r.gasPrice, r.nested ? 1 : 0].join(".")
  return `${body}.${sign(body)}`
}

export function verifyShare(token: string): SharedResult | null {
  const parts = token.split(".")
  if (parts.length !== 7) return null
  const [network, hash, gasUsed, estimate, gasPrice, nested, sig] = parts
  const expected = Buffer.from(sign(parts.slice(0, 6).join(".")), "base64url")
  const given = Buffer.from(sig, "base64url")
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  if (
    !NETWORKS.some((n) => n.id === network) ||
    !HASH.test(hash) ||
    !GAS.test(gasUsed) ||
    !GAS.test(estimate) ||
    !WEI.test(gasPrice) ||
    (nested !== "0" && nested !== "1")
  ) {
    return null
  }
  return {
    network,
    hash: `0x${hash}`,
    gasUsed: Number(gasUsed),
    estimate: Number(estimate),
    gasPrice,
    nested: nested === "1",
  }
}

/** The share link for the nested estimate, from the target-only one and what nesting gains over it. */
export function nestedShare(base: string, network: string, hash: string, gain: number): string | undefined {
  const r = verifyShare(base)
  // A nested token as the base would subtract the gain again on every round.
  if (!r || r.nested || r.network !== network || r.hash !== hash.toLowerCase()) return undefined
  return signShare({ ...r, estimate: Math.max(0, r.estimate - gain), nested: true })
}

function sign(body: string): string {
  // Like Better Auth, which reads the same variable, tolerate it unset outside production.
  const secret = process.env.BETTER_AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-share-secret" : undefined)
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set")
  // Domain-separated so a share signature can never stand in for one Better Auth makes with the same secret.
  return createHmac("sha256", `analyzer-share:${secret}`).update(body).digest().subarray(0, SIG_BYTES).toString("base64url")
}
