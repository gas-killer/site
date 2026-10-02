import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"
import {
  AnalyzerError,
  DEFAULT_ESTIMATOR_ADDRESS,
  fetchTrace,
  fetchTransactionInfo,
  rpcUrlFor,
} from "@/lib/analyzer/trace"
import { usdPrice } from "@/lib/analyzer/price"
import { analyzeTrace, type AnalyzeResponse } from "@/lib/wasm/analyzer"

// Hobby's ceiling. Traces are analyzed here rather than in the browser because they routinely run
// to tens of MB, far past the 4.5MB a function may return.
export const maxDuration = 60

const TX_HASH = /^0x[0-9a-fA-F]{64}$/

export async function POST(request: NextRequest) {
  if (ANALYZER_DISABLED) {
    return Response.json({ error: "The analyzer is temporarily disabled" }, { status: 503 })
  }

  // Traces are fetched through paid archive RPCs, and signup hands out a session before the email
  // is proven, so only confirmed users may analyze.
  const session = await auth.api.getSession({ headers: request.headers })
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
    const [trace, price] = await Promise.all([fetchTrace(url, txHash), usdPrice(network)])

    let result
    try {
      result = analyzeTrace(trace, DEFAULT_ESTIMATOR_ADDRESS, info.from, info.blockNumber, info.to)
    } catch (e) {
      throw new AnalyzerError(422, e instanceof Error ? e.message : String(e))
    }

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
    if (e instanceof AnalyzerError) return Response.json({ error: e.message }, { status: e.status })
    console.error("analyze failed", e)
    return Response.json({ error: "Analysis failed unexpectedly" }, { status: 500 })
  }
}
