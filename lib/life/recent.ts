import "server-only"
import { createPublicClient, http, type Hex, type Log } from "viem"
import { sepolia } from "viem/chains"
import { LIFE_ABI, LIFE_ADDRESS, LIFE_DEPLOY_BLOCK } from "@/lib/life/config"

/** A settled run, with bigints as decimal strings for JSON. */
export type RecentRow = { gen: string; steps: string | null; hash: Hex; gasUsed: string; timestamp: string }

// publicnode has been answering eth_getLogs with [] and receipts with null for this contract's blocks,
// with no error, so it goes last.
const RPC_URLS = [
  ...new Set(
    [process.env.RPC_SEPOLIA, "https://sepolia.gateway.tenderly.co", "https://ethereum-sepolia-rpc.publicnode.com"].filter(
      (u): u is string => !!u,
    ),
  ),
]
// One client per RPC: viem's fallback() only moves on after an error, not after an empty answer.
const clients = RPC_URLS.map((u) => createPublicClient({ chain: sepolia, transport: http(u, { timeout: 10_000 }) }))
type Client = (typeof clients)[number]
type Stepped = Log & { args: { generation: bigint } }

const receiptCache = new Map<Hex, { gasUsed: bigint; timestamp: bigint }>()

/**
 * The latest runs, newest first. `atLeast` is the generation the page's board shows: an RPC whose
 * newest run is older than that is lagging or dropping logs, so the next one is tried. If none has
 * caught up, the best partial answer comes back with `complete: false`.
 */
export async function fetchRecent(atLeast: bigint): Promise<{ rows: RecentRow[]; complete: boolean }> {
  let partial: RecentRow[] | undefined
  let lastErr: unknown
  for (const [i, client] of clients.entries()) {
    try {
      const all = await fetchSteppedLogs(client)
      const newest = all[0]?.args.generation ?? 0n
      if (newest >= atLeast) return { rows: await rowsFrom(client, all), complete: true }
      if (!partial && all.length > 0) partial = await rowsFrom(client, all)
      throw new Error(`newest GenerationStepped is ${newest}, board is at ${atLeast}`)
    } catch (err) {
      console.warn(`life recent: RPC ${i} failed`, err instanceof Error ? err.message.split("\n")[0] : err)
      lastErr = err
    }
  }
  if (partial) return { rows: partial, complete: false }
  throw lastErr
}

async function fetchSteppedLogs(client: Client): Promise<Stepped[]> {
  const [chainId, latest] = await Promise.all([client.getChainId(), client.getBlockNumber()])
  // A mainnet URL in RPC_SEPOLIA would otherwise just look like an empty history.
  if (chainId !== sepolia.id) throw new Error(`RPC is on chain ${chainId}, not Sepolia`)
  // Two blocks back: a load-balanced RPC's lagging node rejects ranges past its head.
  const head = latest - 2n
  const out: Stepped[] = []
  const CHUNK = 40_000n
  for (let to = head; to >= LIFE_DEPLOY_BLOCK && out.length < 9; to -= CHUNK) {
    const from = to - CHUNK + 1n > LIFE_DEPLOY_BLOCK ? to - CHUNK + 1n : LIFE_DEPLOY_BLOCK
    const logs = await client.getContractEvents({
      address: LIFE_ADDRESS,
      abi: LIFE_ABI,
      eventName: "GenerationStepped",
      fromBlock: from,
      toBlock: to,
    })
    out.unshift(...(logs as unknown as Stepped[]))
    if (from === LIFE_DEPLOY_BLOCK) break
  }
  // One extra (older) log so every shown row knows how many generations it advanced.
  return out.slice(-9).reverse()
}

async function rowsFrom(client: Client, all: Stepped[]): Promise<RecentRow[]> {
  return Promise.all(
    all.slice(0, 8).map(async (log, i) => {
      const hash = log.transactionHash!
      let info = receiptCache.get(hash)
      if (!info) {
        const [receipt, block] = await Promise.all([
          client.getTransactionReceipt({ hash }),
          client.getBlock({ blockNumber: log.blockNumber! }),
        ])
        info = { gasUsed: receipt.gasUsed, timestamp: block.timestamp }
        receiptCache.set(hash, info)
      }
      const prev = all[i + 1]?.args.generation ?? (all.length < 9 ? 0n : undefined)
      return {
        gen: log.args.generation.toString(),
        steps: prev === undefined ? null : (log.args.generation - prev).toString(),
        hash,
        gasUsed: info.gasUsed.toString(),
        timestamp: info.timestamp.toString(),
      }
    }),
  )
}
