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

/** Base URL of the router ingress; matches the default server in `openapi.yaml`. */
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

function isAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value)
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
