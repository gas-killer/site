import { Callout } from "fumadocs-ui/components/callout"
import { ROUTER_BASE_URL, fetchAvsContracts } from "@/lib/avs-metadata"

/**
 * Renders the addresses a target must be wired to, read from the router's
 * `GET /avs-metadata` at render time.
 *
 * The router is the only authority on these: they belong to whichever AVS
 * deployment is currently signing. The stake registry is pinned so it survives
 * a redeployment, but a migration to a new operator set moves it, and a new AVS
 * moves avsAddress. Reading them here means the page cannot drift from the
 * deployment the way a hand-maintained table does.
 *
 * When the router publishes no contract set the last-verified pair is shown
 * instead, labelled as a snapshot so a reader knows to check it. That fallback
 * exists only until every deployment serves the block, and can be deleted then.
 */

/** Last pair verified on chain, for when the router publishes no contract set. */
const FALLBACK = {
  chainId: 11155111,
  avsAddress: "0x0eF3c25243004C0F81Dc678c3411E619D61577ef",
  schnorrStakeRegistry: "0x8A86301675ac9617895117afFE9577f5154555F9",
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
          <Row label="schnorrStakeRegistry" value={c.schnorrStakeRegistry} />
          {live && contracts.registryCoordinator ? (
            <Row
              label="registryCoordinator"
              value={contracts.registryCoordinator}
            />
          ) : null}
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
            <strong>No live contract set available</strong>, so this is the last
            pair verified on chain rather than a live reading. The router was
            unreachable, or answered with something this page would not publish.
            Treat it as a snapshot and check it before you deploy by asking the
            router directly:
          </p>
          <pre>
            <code>{`curl -s ${ROUTER_BASE_URL}/avs-metadata | jq .contracts`}</code>
          </pre>
        </Callout>
      )}
    </>
  )
}
