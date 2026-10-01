import "server-only"
import { createPublicClient, createWalletClient, encodeFunctionData, http, type Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import { LIFE_ABI, LIFE_ADDRESS, type Generations } from "@/lib/life/config"

type TaskStatus = "queued" | "processing" | "ready" | "failed" | "expired"
interface TaskView {
  task_id: string
  status: TaskStatus
  error: string | null
  payload: { to: Hex; data: Hex; value: Hex; estimated_gas: number; valid_until_block: number } | null
}

/** A failure the page can show as-is. */
export class LifeRunError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message)
  }
}

const BUSY = "Lots of people are running generations. Try again in a few seconds."

const rpcUrl = () => process.env.RPC_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com"

export function runGenerations(generations: Generations): Promise<{ txHash: Hex; taskId: string }> {
  return withRunLock(() => settleGenerations(generations))
}

async function settleGenerations(generations: Generations): Promise<{ txHash: Hex; taskId: string }> {
  const pk = process.env.LIFE_RELAYER_PRIVATE_KEY as Hex | undefined
  if (!pk) throw new Error("LIFE_RELAYER_PRIVATE_KEY is not set")
  const account = privateKeyToAccount(pk)
  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl()) })
  const wallet = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl()) })

  const callData = encodeFunctionData({ abi: LIFE_ABI, functionName: "step", args: [generations] })

  // The operators compute against the board at `block_height`, and the payload only lands if no
  // other run settles first. Function instances don't share memory, so the relayer's nonce is the
  // lock: we note nonce N while the board is settled, compute, and send with exactly nonce N. If
  // another run took N first, ours is dropped or rejected and we go again against the new board.
  const deadline = Date.now() + 150_000
  let lastError = ""
  while (Date.now() < deadline) {
    const { height, generation, nonce } = await settledState(publicClient, account.address, deadline)
    const taskId = await submitTask(callData, account.address, Number(height))
    const task = await waitForTask(taskId)
    if (task.status !== "ready" || !task.payload) {
      lastError = task.error ?? task.status
      continue
    }

    const [pendingNow, generationNow] = await Promise.all([
      publicClient.getTransactionCount({ address: account.address, blockTag: "pending" }),
      currentGeneration(publicClient),
    ])
    if (pendingNow !== nonce || generationNow !== generation) {
      lastError = "another run settled first"
      continue
    }

    const tx = { account, to: task.payload.to, data: task.payload.data, value: BigInt(task.payload.value) }
    // A stale payload reverts in simulation, so it never costs gas.
    try {
      await publicClient.call(tx)
    } catch (err) {
      lastError = `payload no longer valid: ${err instanceof Error ? err.message.split("\n")[0] : err}`
      continue
    }

    let txHash: Hex
    try {
      txHash = await wallet.sendTransaction({ ...tx, nonce, gas: BigInt(Math.ceil(task.payload.estimated_gas * 1.3)) })
    } catch (err) {
      // Nonce already used / replacement underpriced: another run won the race.
      lastError = err instanceof Error ? err.message.split("\n")[0] : String(err)
      continue
    }

    const outcome = await awaitOwnSettlement(publicClient, account.address, txHash, nonce)
    if (outcome === "success") return { txHash, taskId }
    lastError = outcome === "reverted" ? "settlement reverted" : "another run took this slot"
  }
  throw new LifeRunError(503, "BUSY", `The board is busy with other runs. Try again in a few seconds. (${lastError.slice(0, 120)})`)
}

type Client = ReturnType<typeof createPublicClient>

const currentGeneration = (client: Client, blockNumber?: bigint) =>
  client.readContract({ address: LIFE_ADDRESS, abi: LIFE_ABI, functionName: "generation", blockNumber })

/**
 * Wait until the relayer has nothing in flight, then pin the latest block: it already contains the
 * previous settlement, so the next run can start right away. The generation check guards against a
 * load-balanced RPC node answering from a block that's behind.
 */
async function settledState(
  client: Client,
  relayer: Hex,
  deadline: number,
): Promise<{ height: bigint; generation: bigint; nonce: number }> {
  while (Date.now() < deadline) {
    const [pending, mined, height] = await Promise.all([
      client.getTransactionCount({ address: relayer, blockTag: "pending" }),
      client.getTransactionCount({ address: relayer, blockTag: "latest" }),
      client.getBlockNumber(),
    ])
    if (pending === mined) {
      const [then, now] = await Promise.all([currentGeneration(client, height), currentGeneration(client)])
      if (then === now) return { height, generation: now, nonce: mined }
    }
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000)) // jitter spreads out racing instances
  }
  throw new LifeRunError(503, "BUSY", BUSY)
}

/** Wait for our tx, or notice that another tx with the same nonce was mined instead. */
async function awaitOwnSettlement(
  client: Client,
  relayer: Hex,
  hash: Hex,
  nonce: number,
): Promise<"success" | "reverted" | "replaced"> {
  const until = Date.now() + 45_000
  while (Date.now() < until) {
    const receipt = await client.getTransactionReceipt({ hash }).catch(() => null)
    if (receipt) return receipt.status === "success" ? "success" : "reverted"
    const mined = await client.getTransactionCount({ address: relayer, blockTag: "latest" })
    if (mined > nonce) {
      // Nonce consumed; one last look in case the receipt lagged behind on this RPC node.
      const late = await client.getTransactionReceipt({ hash }).catch(() => null)
      if (late) return late.status === "success" ? "success" : "reverted"
      return "replaced"
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  return "replaced"
}

function gk(path: string, init: RequestInit = {}): Promise<Response> {
  const routerUrl = process.env.ROUTER_URL
  const key = process.env.LIFE_GK_API_KEY
  if (!routerUrl || !key) throw new Error("ROUTER_URL and LIFE_GK_API_KEY must be set")
  return fetch(new URL(path, routerUrl), {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    cache: "no-store",
  })
}

async function submitTask(callData: Hex, from: Hex, blockHeight: number): Promise<string> {
  const body = JSON.stringify({
    body: {
      target_address: LIFE_ADDRESS,
      call_data: Array.from(Buffer.from(callData.slice(2), "hex")),
      transition_index: "auto",
      from_address: from,
      value: "0x0",
      block_height: blockHeight,
    },
  })
  // The router's node can be a moment behind ours and reject the block as "ahead of current chain
  // height". Wait for it to catch up rather than pinning an older block that predates the last run.
  for (let attempt = 0; ; attempt++) {
    const res = await gk("/tasks", { method: "POST", body })
    if (res.status === 429 || res.status === 503) {
      throw new LifeRunError(503, "BUSY", "Gas Killer's queue is full right now. Try again in a minute.")
    }
    if (res.ok) return ((await res.json()) as { task_id: string }).task_id
    const text = await res.text()
    if (res.status === 400 && /ahead of current chain height/i.test(text) && attempt < 8) {
      await new Promise((r) => setTimeout(r, 1500))
      continue
    }
    throw new Error(`POST /tasks ${res.status}: ${text.slice(0, 300)}`)
  }
}

async function waitForTask(taskId: string): Promise<TaskView> {
  const deadline = Date.now() + 25_000
  while (Date.now() < deadline) {
    const res = await gk(`/tasks/${taskId}`)
    if (res.status === 409) return { task_id: taskId, status: "expired", error: "payload expired", payload: null }
    if (!res.ok) throw new Error(`GET /tasks/${taskId} ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const task = (await res.json()) as TaskView
    if (task.status === "ready" || task.status === "failed" || task.status === "expired") return task
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new LifeRunError(504, "TIMEOUT", "Operators took too long to sign. Try again.")
}

// Runs must settle one after another, since each diff is computed against the board the previous one
// left. This only queues runs within an instance; across instances the relayer nonce above decides.
const LOCK_WAIT_MS = 60_000
let localChain: Promise<unknown> = Promise.resolve()

async function withRunLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = localChain
  let release!: () => void
  localChain = new Promise<void>((r) => (release = r))
  try {
    let timer: ReturnType<typeof setTimeout> | undefined
    await Promise.race([
      prev,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new LifeRunError(503, "BUSY", BUSY)), LOCK_WAIT_MS)
      }),
    ]).finally(() => clearTimeout(timer))
    return await fn()
  } finally {
    release()
  }
}
