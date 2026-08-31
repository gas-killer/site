import { Callout } from "fumadocs-ui/components/callout"
import { ROUTER_BASE_URL, fetchAvsContracts } from "@/lib/avs-metadata"

/**
 * Renders the addresses a target must be wired to, read from the router's
 * `GET /avs-metadata` at render time.
 *
 * The router is the only authority on these: they belong to whichever AVS
 * deployment is currently signing, and each redeployment provisions a new
 * signature checker. Reading them here means the page cannot drift from the
 * deployment the way a hand-maintained table does.
 *
 * When the router publishes no contract set the last-verified pair is shown
 * instead, labelled as a snapshot so a reader knows to check it. That fallback
 * exists only until every deployment serves the block, and can be deleted then.
 */

/** Last pair verified on chain, for when the router publishes no contract set. */
const FALLBACK = {
  chainId: 11155111,
  avsAddress: "0xdCec8ce0a03848B55989Bcc711e424Ca31d9eeD9",
  blsSignatureChecker: "0x6953fc47FC8b7568801f3fdc327bc0d9aD12E5b9",
  registryCoordinator: "0x0a032D62dde46670Ae40Ce532C97f6CE9Af72Dc4",
} as const

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="whitespace-nowrap font-medium">{label}</td>
      <td>
        <code className="break-all">{value}</code>
      </td>
    </tr>
  )
}

export async function AvsContracts() {
  const contracts = await fetchAvsContracts()
  const live = contracts !== null
  const c = contracts ?? FALLBACK

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Chain ID" value={String(c.chainId)} />
          <Row label="avsAddress" value={c.avsAddress} />
          <Row label="blsSignatureChecker" value={c.blsSignatureChecker} />
          <Row label="registryCoordinator" value={c.registryCoordinator} />
          {live && contracts.demoTarget ? (
            <Row label="demoTarget" value={contracts.demoTarget} />
          ) : null}
          {live && contracts.demoFactory ? (
            <Row label="demoFactory" value={contracts.demoFactory} />
          ) : null}
        </tbody>
      </table>

      {live ? (
        <p className="text-sm text-fd-muted-foreground">
          Read from{" "}
          <a href="/docs/api/metadata/getAvsMetadata">
            <code>GET /avs-metadata</code>
          </a>{" "}
          on the router itself, so this table follows the deployment rather than
          being maintained by hand. Cached for up to an hour.
        </p>
      ) : (
        <Callout type="warn">
          <p>
            <strong>Could not reach the router</strong>, so this is the last pair
            verified on chain rather than a live reading. Treat it as a snapshot
            and check it before you deploy by asking the router directly:
          </p>
          <pre>
            <code>{`curl -s ${ROUTER_BASE_URL}/avs-metadata | jq .contracts`}</code>
          </pre>
        </Callout>
      )}
    </>
  )
}
