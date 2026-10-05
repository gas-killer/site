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
  // "prestate": from the storage diff and call tree; "trace": from the full struct-log trace.
  method: "prestate" | "trace"
  // Why the prestate path wasn't used, when it wasn't.
  prestateSkipped: string | null
  tx: AnalyzedTransaction
  // The native token's USD price today, or null on a testnet or when it couldn't be fetched.
  usdPrice: number | null
}

// Read by path at runtime, so outputFileTracingIncludes in next.config.mjs ships it.
const WASM_PATH = path.join(process.cwd(), "node_modules/@gas-killer/analyzer-wasm/gas_killer_wasm_bg.wasm")
// Turbopack resolves this at build time and points it at the bundled worker.
const WORKER_PATH = path.join(process.cwd(), "lib/wasm/analyze-worker.mjs")

let compiled: Promise<WebAssembly.Module> | undefined

// `wasmBytes` is the analyzer's wasm memory when it finished, if it got that far.
type Failure = { ok: false; kind: "rpc" | "too_large" | "analysis" | "timeout" | "crashed"; message: string; wasmBytes?: number }

export type AnalysisOutcome = { ok: true; result: AnalyzeTraceResult; wasmBytes?: number } | Failure

export type PrestateOutcome =
  | { ok: true; eligible: true; result: AnalyzeTraceResult }
  | { ok: true; eligible: false; reason: string }
  | Failure

/**
 * Analyze a raw debug_traceTransaction response in a fresh worker. The main thread stays free for
 * other requests on the instance, a wasm trap can't poison the next run, and the wasm's memory,
 * which never shrinks, goes back with the worker.
 */
export function analyzeTrace(
  bytes: Uint8Array,
  estimatorAddress: string,
  callerAddress: string,
  blockNumber: bigint,
  originAddress: string | null,
  timeoutMs: number,
): Promise<AnalysisOutcome> {
  return runWorker<AnalysisOutcome>(
    { mode: "trace", bytes, estimatorAddress, callerAddress, blockNumber, originAddress },
    // Hands the trace over without a copy; `bytes` is unusable here afterwards.
    [bytes.buffer as ArrayBuffer],
    timeoutMs,
  )
}

/** Analyze from the prestate diff and call frame, in a worker for the same reasons as analyzeTrace. */
export function analyzePrestate(
  traces: { diff: string; frame: string },
  consumerAddress: string,
  estimatorAddress: string,
  callerAddress: string,
  blockNumber: bigint,
  timeoutMs: number,
): Promise<PrestateOutcome> {
  return runWorker<PrestateOutcome>(
    { mode: "prestate", ...traces, consumerAddress, estimatorAddress, callerAddress, blockNumber },
    [],
    timeoutMs,
  )
}

async function runWorker<T>(data: object, transferList: ArrayBuffer[], timeoutMs: number): Promise<T | Failure> {
  compiled ??= readFile(WASM_PATH).then((buf) => WebAssembly.compile(buf))
  const module = await compiled.catch((e) => {
    compiled = undefined
    throw e
  })

  const worker = new Worker(WORKER_PATH, { workerData: { module, ...data }, transferList })
  return new Promise<T | Failure>((resolve) => {
    const timer = setTimeout(() => {
      resolve({ ok: false, kind: "timeout", message: "Analyzing this transaction took too long." })
      void worker.terminate()
    }, timeoutMs)
    const settle = (outcome: T | Failure) => {
      clearTimeout(timer)
      resolve(outcome)
      void worker.terminate()
    }
    worker.once("message", settle)
    worker.once("error", (e) => settle({ ok: false, kind: "crashed", message: e.message }))
    worker.once("exit", (code) => settle({ ok: false, kind: "crashed", message: `Analyzer exited with code ${code}` }))
  })
}
