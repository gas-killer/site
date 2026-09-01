/**
 * Reads the router's published contract set from `GET /avs-metadata`.
 *
 * These addresses are properties of a specific AVS deployment, not constants of
 * the protocol: redeploying the operator set changes the signature checker, and a
 * target wired to a superseded one produces payloads that revert
 * `InvalidQuorumApkHash`. Documenting them by hand is how they go stale, so the
 * Configuration page reads them from the router instead.
 *
 * Fetched server-side. The router sets no CORS headers (see
 * `app/api/proxy/route.ts`), so a browser cannot reach it directly.
 */

import { keccak_256 } from "@noble/hashes/sha3.js"

/** Base URL of the router ingress; matches the default server in `openapi.json`. */
const ROUTER_BASE_URL =
  process.env.NEXT_PUBLIC_ROUTER_URL ?? "https://testnet.gaskiller.xyz"

/** How long a fetched contract set is reused before the next render refetches. */
const REVALIDATE_SECONDS = 3600

/** The settlement-relevant addresses published in the `contracts` block. */
export interface AvsContracts {
  chainId: number
  avsAddress: string
  blsSignatureChecker: string
  registryCoordinator: string
  demoTarget?: string
  demoFactory?: string
}

/**
 * True only for an address that is well-formed **and** carries a valid EIP-55
 * checksum.
 *
 * Shape alone is not enough. The endpoint documents these as checksummed so they
 * can be pasted into Solidity as-is, where a lowercase literal is a compile
 * error. A router that regressed to serving a well-formed lowercase address
 * would otherwise pass this guard and the page would publish something an
 * integrator cannot use, which is the one outcome the validation exists to
 * prevent.
 *
 * Note the check cannot be approximated by "reject all-lowercase": per EIP-55,
 * an address whose letters all hash to a low nibble is legitimately all
 * lowercase (`0xde709f2102306220921060314715629080e2fb77` is the spec's own
 * example), so the real hash is required.
 */
function isAddress(value: unknown): value is string {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    return false
  }
  const body = value.slice(2)
  const lower = body.toLowerCase()
  const hash = keccak_256(new TextEncoder().encode(lower))
  for (let i = 0; i < 40; i++) {
    const c = lower[i]
    // Digits are case-invariant; only a-f carry the checksum.
    if (c < "a" || c > "f") continue
    const nibble = (hash[i >> 1] >> (i % 2 === 0 ? 4 : 0)) & 0xf
    if (body[i] !== (nibble >= 8 ? c.toUpperCase() : c)) return false
  }
  return true
}

/**
 * Validates the block rather than trusting it: a docs page publishing an address
 * an integrator will wire into a contract should render nothing rather than
 * render a malformed value.
 */
function parseContracts(value: unknown): AvsContracts | null {
  if (typeof value !== "object" || value === null) return null
  const c = value as Record<string, unknown>
  if (
    typeof c.chainId !== "number" ||
    !isAddress(c.avsAddress) ||
    !isAddress(c.blsSignatureChecker) ||
    !isAddress(c.registryCoordinator)
  ) {
    return null
  }
  return {
    chainId: c.chainId,
    avsAddress: c.avsAddress,
    blsSignatureChecker: c.blsSignatureChecker,
    registryCoordinator: c.registryCoordinator,
    demoTarget: isAddress(c.demoTarget) ? c.demoTarget : undefined,
    demoFactory: isAddress(c.demoFactory) ? c.demoFactory : undefined,
  }
}

/**
 * The published contract set, or `null` when the router is unreachable or does
 * not publish one. Never throws: the docs build must not depend on the testnet
 * being up.
 */
export async function fetchAvsContracts(): Promise<AvsContracts | null> {
  try {
    const resp = await fetch(`${ROUTER_BASE_URL}/avs-metadata`, {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!resp.ok) return null
    const body = (await resp.json()) as Record<string, unknown>
    return parseContracts(body.contracts)
  } catch {
    return null
  }
}

export { ROUTER_BASE_URL }
