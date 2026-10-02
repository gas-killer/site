import "server-only"
import { readFileSync } from "node:fs"
import path from "node:path"
import { analyze_trace, initSync } from "@gas-killer/analyzer-wasm"

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

// Traced into the function by outputFileTracingIncludes in next.config.mjs.
const WASM_PATH = path.join(process.cwd(), "node_modules/@gas-killer/analyzer-wasm/gas_killer_wasm_bg.wasm")

let initialized = false

export function analyzeTrace(
  traceJson: string,
  estimatorAddress: string,
  callerAddress: string,
  blockNumber: bigint,
  originAddress: string | null,
): AnalyzeTraceResult {
  if (!initialized) {
    initSync({ module: readFileSync(WASM_PATH) })
    initialized = true
  }
  return analyze_trace(traceJson, estimatorAddress, callerAddress, blockNumber, originAddress)
}
