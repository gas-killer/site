import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"
import {
  AnalyzerError,
  DEFAULT_ESTIMATOR_ADDRESS,
  fetchPrestateTraces,
  fetchTrace,
  fetchTransactionInfo,
  type PrestateTraces,
  rpcUrlFor,
  traceTooLarge,
} from "@/lib/analyzer/trace"
import { usdPrice } from "@/lib/analyzer/price"
import { oneAtATime } from "@/lib/analyzer/serial"
import { analyzePrestate, analyzeTrace, type AnalyzeResponse, type AnalyzeTraceResult } from "@/lib/wasm/analyzer"

// Hobby's ceiling. Traces are analyzed here rather than in the browser because they routinely run
// to tens of MB, far past the 4.5MB a function may return.
export const maxDuration = 60

const TX_HASH = /^0x[0-9a-fA-F]{64}$/
// The receipt (8s) and prestate tracers (6s) run together, so with the trace's 22s
// (lib/analyzer/trace.ts) the worst case is 8 + 3 + 10 + 22 + 12 = 55s, under 60s with room for auth.
const PRESTATE_ANALYSIS_TIMEOUT_MS = 3_000
const TURN_WAIT_MS = 10_000
const ANALYSIS_TIMEOUT_MS = 12_000

const OUTCOME_STATUS = { rpc: 502, analysis: 422, timeout: 504, crashed: 500 } as const

export async function POST(request: NextRequest) {
  if (ANALYZER_DISABLED) {
    return Response.json({ error: "The analyzer is temporarily disabled" }, { status: 503 })
  }

  // Traces are fetched through paid archive RPCs, and signup hands out a session before the email
  // is proven, so only confirmed users may analyze.
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } })
  if (!session) {
    return Response.json({ error: "Sign in to use the analyzer" }, { status: 401 })
  }
  if (!session.user.emailVerified) {
    return Response.json({ error: "Confirm your email to use the analyzer" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as { network?: unknown; txHash?: unknown } | null
  const network = body?.network
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : ""
  if (typeof network !== "string" || !TX_HASH.test(txHash)) {
    return Response.json({ error: "Enter a 0x-prefixed, 32-byte transaction hash" }, { status: 400 })
  }

  try {
    const url = rpcUrlFor(network)
    // Fetched alongside the receipt since they need only the hash; any failure just means the full trace.
    const [info, prestate] = await Promise.all([
      fetchTransactionInfo(url, txHash),
      fetchPrestateTraces(url, txHash).catch((e: unknown) => (e instanceof Error ? e.message : String(e))),
    ])
    const [analysis, price] = await Promise.all([
      fromPrestate(prestate, info).then(async (pre) =>
        pre.result
          ? { result: pre.result, method: "prestate" as const, prestateSkipped: null }
          : { result: await fromTrace(url, txHash, info), method: "trace" as const, prestateSkipped: pre.skipped },
      ),
      usdPrice(network),
    ])

    const response: AnalyzeResponse = {
      ...analysis,
      tx: {
        hash: txHash,
        network,
        blockNumber: info.blockNumber.toString(),
        from: info.from,
        to: info.to,
        gasUsed: info.gasUsed,
        effectiveGasPrice: info.effectiveGasPrice.toString(),
      },
      usdPrice: price,
    }
    return Response.json(response)
  } catch (e) {
    if (e instanceof AnalyzerError) return Response.json({ error: e.message, code: e.code }, { status: e.status })
    console.error("analyze failed", e)
    return Response.json({ error: "Analysis failed unexpectedly" }, { status: 500 })
  }
}

type Info = Awaited<ReturnType<typeof fetchTransactionInfo>>

/**
 * The analysis from the prestate tracers, which stay small however much the call computes, or why it
 * can't be used: the tracers failed, or the call has no net form.
 */
async function fromPrestate(
  traces: PrestateTraces | string,
  info: Info,
): Promise<{ result: AnalyzeTraceResult; skipped?: never } | { result?: never; skipped: string }> {
  if (typeof traces === "string") return { skipped: `prestate tracers failed: ${traces}` }
  if (!info.to) return { skipped: "transaction has no target address" }
  const outcome = await analyzePrestate(
    traces,
    info.to,
    DEFAULT_ESTIMATOR_ADDRESS,
    info.from,
    info.blockNumber,
    PRESTATE_ANALYSIS_TIMEOUT_MS,
  )
  if (!outcome.ok) {
    if (outcome.kind === "crashed") console.error("prestate analyzer worker crashed", outcome.message)
    return { skipped: `prestate analysis failed: ${outcome.message}` }
  }
  return outcome.eligible ? { result: outcome.result } : { skipped: outcome.reason }
}

/** The analysis from the full struct-log trace, one per instance at a time since traces can be huge. */
function fromTrace(url: string, txHash: string, info: Info): Promise<AnalyzeTraceResult> {
  return oneAtATime(TURN_WAIT_MS, async () => {
    const trace = await fetchTrace(url, txHash)
    const outcome = await analyzeTrace(
      trace,
      DEFAULT_ESTIMATOR_ADDRESS,
      info.from,
      info.blockNumber,
      info.to,
      ANALYSIS_TIMEOUT_MS,
    )
    if (outcome.ok) return outcome.result
    if (outcome.kind === "too_large") throw traceTooLarge(`RPC error: ${outcome.message}`)
    if (outcome.kind === "crashed") console.error("analyzer worker crashed", outcome.message)
    const message = outcome.kind === "crashed" ? "Analysis failed unexpectedly" : outcome.message
    throw new AnalyzerError(OUTCOME_STATUS[outcome.kind], message)
  })
}
