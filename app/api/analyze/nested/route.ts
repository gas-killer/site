import { NextRequest } from "next/server"
import { analyzerAccess } from "@/lib/analyzer/access"
import { MAX_OWNED, parseOwned } from "@/lib/analyzer/callees"
import { oneAtATime } from "@/lib/analyzer/serial"
import { nestedShare } from "@/lib/analyzer/share"
import { type AnalyzerRun, failRun, recordRun, startRun } from "@/lib/analyzer/usage"
import {
  AnalyzerError,
  fetchPrestate,
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
  const access = await analyzerAccess(request.headers)
  if ("denied" in access) return access.denied
  const run = startRun(access.userId, "nested")
  return recordRun(run, await analyzeNested(request, run, deadline))
}

async function analyzeNested(request: NextRequest, run: AnalyzerRun, deadline: number): Promise<Response> {
  const body = (await request.json().catch(() => null)) as
    | { network?: unknown; txHash?: unknown; owned?: unknown; share?: unknown }
    | null
  const network = body?.network
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : ""
  run.network = typeof network === "string" ? network : null
  run.txHash = txHash || null
  if (typeof network !== "string" || !TX_HASH.test(txHash)) {
    return failRun(run, 400, "Enter a 0x-prefixed, 32-byte transaction hash")
  }
  const owned = parseOwned(body?.owned)
  if (!owned) {
    return failRun(run, 400, `Choose between 1 and ${MAX_OWNED} contracts you own`)
  }
  run.owned = owned

  try {
    const url = rpcUrlFor(network)
    // The diff seeds the starting state; without it every write is priced as one to an empty slot. The
    // full prestate lets the callees outside the tree run their own code instead.
    const [info, diff, prestate] = await Promise.all([
      fetchTransactionInfo(url, txHash),
      fetchPrestateDiff(url, txHash).catch(() => null),
      fetchPrestate(url, txHash).catch(() => null),
    ])
    const root = info.to
    run.target = root
    run.gasUsed = info.gasUsed
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
        prestate ? { prestate, gasPrice: info.effectiveGasPrice, timestamp: info.blockTimestamp } : null,
        deadline - Date.now(),
      )
      if (outcome.ok && outcome.result.replay_error) {
        console.log(`nested analyzer replay failed: network=${network} tx=${txHash} error=${outcome.result.replay_error.slice(0, 300)}`)
      }
      if (outcome.ok) return outcome.result
      if (outcome.kind === "too_large") throw traceTooLarge(`RPC error: ${outcome.message}`)
      if (outcome.kind === "crashed") console.error("nested analyzer worker crashed", outcome.message)
      const message = outcome.kind === "crashed" ? "Analysis failed unexpectedly" : outcome.message
      throw new AnalyzerError(OUTCOME_STATUS[outcome.kind], message)
    })
    run.method = "trace"
    run.estimate = analysis.nested_gas + analysis.signature_verification_gas
    run.details = {
      rootOnlyEstimate: analysis.root_only_gas + analysis.signature_verification_gas,
      frames: analysis.frames.length,
      notNested: analysis.not_nested,
      calleesExecuted: analysis.callees_executed,
      replayError: analysis.replay_error,
      skippedOpcodes: analysis.skipped_opcodes,
    }

    const share =
      typeof body?.share === "string"
        ? nestedShare(body.share, network, txHash, analysis.root_only_gas - analysis.nested_gas)
        : undefined
    const response: NestedResponse = { analysis, share }
    return Response.json(response)
  } catch (e) {
    if (e instanceof AnalyzerError) return failRun(run, e.status, e.message, e.code)
    console.error("nested analyze failed", e)
    return failRun(run, 500, "Analysis failed unexpectedly")
  }
}
