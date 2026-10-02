import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { Worker } from "node:worker_threads"

export interface AnalyzeTraceResult {
  encoded_updates: string
  gas_estimate: number
  is_heuristic: boolean
  state_update_count: number
  skipped_opcodes: string[]
  reentered: boolean
}

export interface AnalyzedTransaction {
  hash: string
  network: string
  blockNumber: string
  from: string
  to: string | null
  gasUsed: number
  // Wei, as a decimal string.
  effectiveGasPrice: string
}

export interface AnalyzeResponse {
  result: AnalyzeTraceResult
  tx: AnalyzedTransaction
  // The native token's USD price today, or null on a testnet or when it couldn't be fetched.
  usdPrice: number | null
}

// Read by path at runtime, so outputFileTracingIncludes in next.config.mjs ships it.
const WASM_PATH = path.join(process.cwd(), "node_modules/@gas-killer/analyzer-wasm/gas_killer_wasm_bg.wasm")
// Turbopack resolves this at build time and points it at the bundled worker.
const WORKER_PATH = path.join(process.cwd(), "lib/wasm/analyze-worker.mjs")

let compiled: Promise<WebAssembly.Module> | undefined

export type AnalysisOutcome =
  | { ok: true; result: AnalyzeTraceResult }
  | { ok: false; kind: "rpc" | "analysis" | "timeout" | "crashed"; message: string }

/**
 * Analyze a raw debug_traceTransaction response in a fresh worker. The main thread stays free for
 * other requests on the instance, a wasm trap can't poison the next run, and the wasm's memory,
 * which never shrinks, goes back with the worker.
 */
export async function analyzeTrace(
  bytes: Uint8Array,
  estimatorAddress: string,
  callerAddress: string,
  blockNumber: bigint,
  originAddress: string | null,
  timeoutMs: number,
): Promise<AnalysisOutcome> {
  compiled ??= readFile(WASM_PATH).then((buf) => WebAssembly.compile(buf))
  const module = await compiled.catch((e) => {
    compiled = undefined
    throw e
  })

  const worker = new Worker(WORKER_PATH, {
    workerData: { module, bytes, estimatorAddress, callerAddress, blockNumber, originAddress },
    // Hands the trace over without a copy; `bytes` is unusable here afterwards.
    transferList: [bytes.buffer as ArrayBuffer],
  })
  return new Promise<AnalysisOutcome>((resolve) => {
    const timer = setTimeout(() => {
      resolve({ ok: false, kind: "timeout", message: "Analyzing this transaction took too long." })
      void worker.terminate()
    }, timeoutMs)
    const settle = (outcome: AnalysisOutcome) => {
      clearTimeout(timer)
      resolve(outcome)
      void worker.terminate()
    }
    worker.once("message", settle)
    worker.once("error", (e) => settle({ ok: false, kind: "crashed", message: e.message }))
    worker.once("exit", (code) => settle({ ok: false, kind: "crashed", message: `Analyzer exited with code ${code}` }))
  })
}
