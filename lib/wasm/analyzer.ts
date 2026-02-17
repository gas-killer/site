export interface AnalyzeTraceResult {
  encoded_updates: string
  gas_estimate: number
  is_heuristic: boolean
  state_update_count: number
  skipped_opcodes: string[]
}

export interface EncodeTraceResult {
  encoded_updates: string
  state_update_count: number
  skipped_opcodes: string[]
}

export interface EstimateGasResult {
  gas_estimate: number
  is_heuristic: boolean
  state_update_count: number
  skipped_opcodes: string[]
}

type WasmModule = {
  analyze_trace: (traceJson: string, estimatorAddress: string) => AnalyzeTraceResult
  estimate_gas_heuristic: (traceJson: string) => EstimateGasResult
  encode_trace: (traceJson: string) => EncodeTraceResult
  default: (moduleOrPath?: string) => Promise<unknown>
}

// Use Function constructor to create a dynamic import that webpack cannot
// statically analyze or bundle. This is necessary because Next.js/webpack
// intercepts import() calls even with webpackIgnore comments.
const dynamicImport = new Function("url", "return import(url)") as (url: string) => Promise<WasmModule>

let initPromise: Promise<WasmModule> | null = null

export async function loadWasm(): Promise<WasmModule> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const mod = await dynamicImport("/wasm/gas_killer_wasm.js")
    await mod.default("/wasm/gas_killer_wasm_bg.wasm")
    return mod
  })()

  return initPromise
}

export function resetWasm() {
  initPromise = null
}
