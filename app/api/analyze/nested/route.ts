import { NextRequest } from "next/server"
import { analyzerAccessDenied } from "@/lib/analyzer/access"
import { MAX_OWNED, parseOwned } from "@/lib/analyzer/callees"
import { oneAtATime } from "@/lib/analyzer/serial"
import {
  AnalyzerError,
  fetchPrestateDiff,
  fetchTrace,
  fetchTransactionInfo,
  rpcUrlFor,
  traceTooLarge,
} from "@/lib/analyzer/trace"
import { analyzeFrameTree, type NestedResponse } from "@/lib/wasm/analyzer"

export const maxDuration = 60

const TX_HASH = /^0x[0-9a-fA-F]{64}$/
// As in /api/analyze: every step after auth fits inside this, leaving maxDuration's last 5s to respond.
const BUDGET_MS = 55_000
const MAX_TURN_WAIT_MS = 10_000
const MIN_TRACE_WORK_MS = 10_000
const MIN_ANALYSIS_MS = 5_000

const OUTCOME_STATUS = { rpc: 502, analysis: 422, timeout: 504, crashed: 500 } as const

/**
 * What the transaction would cost settled as a nested tree, had its target and the `owned` contracts
 * integrated the SDK. Always from the struct-log trace: the prestate net form has no frames.
 */
export async function POST(request: NextRequest) {
  const deadline = Date.now() + BUDGET_MS
  const denied = await analyzerAccessDenied(request.headers)
  if (denied) return denied

  const body = (await request.json().catch(() => null)) as
    | { network?: unknown; txHash?: unknown; owned?: unknown }
    | null
  const network = body?.network
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : ""
  if (typeof network !== "string" || !TX_HASH.test(txHash)) {
    return Response.json({ error: "Enter a 0x-prefixed, 32-byte transaction hash" }, { status: 400 })
  }
  const owned = parseOwned(body?.owned)
  if (!owned) {
    return Response.json({ error: `Choose between 1 and ${MAX_OWNED} contracts you own` }, { status: 400 })
  }

  try {
    const url = rpcUrlFor(network)
    // The diff seeds the starting state; without it every write is priced as one to an empty slot.
    const [info, diff] = await Promise.all([
      fetchTransactionInfo(url, txHash),
      fetchPrestateDiff(url, txHash).catch(() => null),
    ])
    const root = info.to
    if (!root) throw new AnalyzerError(422, "This transaction has no target contract to settle through.")

    const turnWait = Math.min(MAX_TURN_WAIT_MS, deadline - Date.now() - MIN_TRACE_WORK_MS)
    if (turnWait < 0) throw new AnalyzerError(504, "Analyzing this transaction took too long.")
    const analysis = await oneAtATime(turnWait, async () => {
      const trace = await fetchTrace(url, txHash, deadline - Date.now() - MIN_ANALYSIS_MS)
      const outcome = await analyzeFrameTree(
        trace,
        root,
        owned,
        info.from,
        info.blockNumber,
        info.value,
        diff,
        deadline - Date.now(),
      )
      if (outcome.ok) return outcome.result
      if (outcome.kind === "too_large") throw traceTooLarge(`RPC error: ${outcome.message}`)
      if (outcome.kind === "crashed") console.error("nested analyzer worker crashed", outcome.message)
      const message = outcome.kind === "crashed" ? "Analysis failed unexpectedly" : outcome.message
      throw new AnalyzerError(OUTCOME_STATUS[outcome.kind], message)
    })

    const response: NestedResponse = { analysis }
    return Response.json(response)
  } catch (e) {
    if (e instanceof AnalyzerError) return Response.json({ error: e.message, code: e.code }, { status: e.status })
    console.error("nested analyze failed", e)
    return Response.json({ error: "Analysis failed unexpectedly" }, { status: 500 })
  }
}
