import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"
import {
  AnalyzerError,
  DEFAULT_ESTIMATOR_ADDRESS,
  fetchTrace,
  fetchTransactionInfo,
  rpcUrlFor,
  traceTooLarge,
} from "@/lib/analyzer/trace"
import { usdPrice } from "@/lib/analyzer/price"
import { oneAtATime } from "@/lib/analyzer/serial"
import { analyzeTrace, type AnalyzeResponse } from "@/lib/wasm/analyzer"

// Hobby's ceiling. Traces are analyzed here rather than in the browser because they routinely run
// to tens of MB, far past the 4.5MB a function may return.
export const maxDuration = 60

const TX_HASH = /^0x[0-9a-fA-F]{64}$/
// With the receipt's 8s and the trace's 25s (lib/analyzer/trace.ts), this stays under 60s with room
// for auth.
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
    const info = await fetchTransactionInfo(url, txHash)
    const [result, price] = await Promise.all([
      oneAtATime(TURN_WAIT_MS, async () => {
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
      }),
      usdPrice(network),
    ])

    const response: AnalyzeResponse = {
      result,
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
