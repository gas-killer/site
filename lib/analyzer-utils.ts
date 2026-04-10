import { AnalyzeTraceResult, WasmModule } from "./wasm/analyzer";

export function validateTraceJson(json: string): { valid: boolean; error?: string } {
  if (!json.trim()) return { valid: false, error: "Input is empty" }

  try {
    const parsed = JSON.parse(json)
    if (typeof parsed !== "object" || parsed === null) {
      return { valid: false, error: "Input must be a JSON object" }
    }
    // Detect full JSON-RPC envelope
    if (!("structLogs" in parsed) && parsed.result && "structLogs" in parsed.result) {
      return {
        valid: false,
        error:
          'It looks like you pasted the full JSON-RPC response. Please paste only the "result" field.',
      }
    }
    if (!("structLogs" in parsed)) {
      return {
        valid: false,
        error: 'Missing "structLogs" field. Expected a Geth trace from debug_traceTransaction.',
      }
    }
    if (!Array.isArray(parsed.structLogs)) {
      return { valid: false, error: '"structLogs" must be an array' }
    }
    return { valid: true }
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${(e as Error).message}` }
  }
}

export async function fetchBlockNumber(network: string, txHash: string): Promise<bigint> {
  const resp = await fetch(`/api/rpc/${network}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [txHash],
      id: 1,
    }),
  })

  if (!resp.ok) {
    const errorBody = await resp.json().catch(() => null)
    throw new Error(errorBody?.error || `HTTP ${resp.status}: ${resp.statusText}`)
  }

  const json = await resp.json()
  if (json.error) {
    throw new Error(`RPC error: ${json.error.message || JSON.stringify(json.error)}`)
  }
  if (!json.result) {
    throw new Error("Transaction not found")
  }

  return BigInt(json.result.blockNumber)
}

export async function fetchTraceFromRpc(network: string, txHash: string): Promise<Uint8Array> {
  const resp = await fetch(`/api/rpc/${network}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "debug_traceTransaction",
      params: [txHash, { enableMemory: true }],
      id: 1,
    }),
  })

  if (!resp.ok) {
    const errorBody = await resp.json().catch(() => null)
    throw new Error(errorBody?.error || `HTTP ${resp.status}: ${resp.statusText}`)
  }

  if (!resp.body) throw new Error("No response body")

  const reader = resp.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    totalBytes += value.byteLength
  }

  const buffer = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength
  }

  // Find "result": by scanning only the first 200 bytes
  const headerBytes = buffer.subarray(0, Math.min(200, buffer.length))
  const headerText = new TextDecoder().decode(headerBytes)

  const resultMatch = headerText.match(/"result"\s*:\s*/)
  if (resultMatch?.index !== undefined) {
    // valueStart is a byte offset — safe because header is ASCII-only
    const valueStart = resultMatch.index + resultMatch[0].length
    const slice = trimEnvelope(buffer, valueStart)
    if (slice.length === 0) {
      throw new Error("Extracted result slice is empty — envelope trimming failed")
    }
    return slice
  }

  const errorMatch = headerText.match(/"error"\s*:\s*/)
  if (errorMatch?.index !== undefined) {
    const errorStart = errorMatch.index + errorMatch[0].length
    const errorText = new TextDecoder().decode(buffer.subarray(errorStart, errorStart + 512))
    const msg = errorText.match(/"message"\s*:\s*"([^"]+)"/)
    throw new Error(`RPC error: ${msg?.[1] ?? errorText}`)
  }

  throw new Error("Unexpected RPC response format")
}

/**
 * Given the full response buffer and the byte index where the result value starts,
 * return a subarray that contains exactly the result object.
 *
 * The envelope is: {"jsonrpc":"2.0","id":1,"result":{...RESULT...}}
 * We need to strip the trailing envelope `}` (and any fields after the result like `,"id":1`).
 *
 * Strategy: the result value starts at a `{`. We scan backwards from the end of the
 * buffer to find the `}` that closes the RESULT object. We do this by tracking brace
 * depth while scanning backwards — the first `}` closes the envelope, then we need
 * to find where depth returns to 0 going further backwards, which is the result's `}`.
 */
function trimEnvelope(buf: Uint8Array, valueStart: number): Uint8Array {
  // Skip leading whitespace
  while (valueStart < buf.length && buf[valueStart] <= 32) valueStart++

  if (valueStart >= buf.length || buf[valueStart] !== 0x7b) {
    // Not an object — return as-is (shouldn't happen for debug_traceTransaction)
    return buf.subarray(valueStart)
  }

  // Walk forwards with a brace counter to find the matching closing brace.
  // This is O(n) but unavoidable — we must confirm the result boundary.
  // We skip string contents to avoid counting braces inside JSON strings.
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = valueStart; i < buf.length; i++) {
    const b = buf[i]

    if (escaped) {
      escaped = false
      continue
    }
    if (inString) {
      if (b === 0x5c) escaped = true       // backslash
      else if (b === 0x22) inString = false // closing quote
      continue
    }

    if (b === 0x22) { inString = true; continue }  // opening quote
    if (b === 0x7b) { depth++; continue }           // {
    if (b === 0x7d) {                               // }
      depth--
      if (depth === 0) {
        return buf.subarray(valueStart, i + 1)
      }
    }
  }

  // Depth never reached 0 — truncated response?
  console.warn("trimEnvelope: never found matching closing brace, returning full tail")
  return buf.subarray(valueStart)
}

export function extractOriginalGas(buf: Uint8Array): number | null {
  const prefix = new TextDecoder().decode(buf.subarray(0, Math.min(500, buf.length)))
  const match = prefix.match(/"gas"\s*:\s*(\d+)/)
  return match ? Number(match[1]) : null
}

function findPatternOffset(buf: Uint8Array, pattern: string): number {
  const needle = new TextEncoder().encode(pattern)
  outer: for (let i = 0; i <= buf.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (buf[i + j] !== needle[j]) continue outer
    }
    return i + needle.length  // points just past the pattern
  }
  return -1
}

function findResultOffset(buf: Uint8Array): number {
  // Search for `"result":` but only in the first 200 bytes (the envelope header)
  const header = buf.subarray(0, Math.min(200, buf.length))
  return findPatternOffset(header, '"result":')
}

function extractResultSlice(buf: Uint8Array, valueStart: number): Uint8Array {
  // Skip whitespace
  while (valueStart < buf.length && buf[valueStart] <= 32) valueStart++

  if (buf[valueStart] !== 0x7b) {  // not '{'
    return buf.subarray(valueStart)
  }

  // Scan backwards from the end to find the closing '}' of the result value
  let i = buf.length - 1
  while (i > valueStart && buf[i] <= 32) i--       // skip trailing whitespace
  if (buf[i] !== 0x7d) return buf.subarray(valueStart)  // not '}'
  i--  // step inside envelope's '}'
  while (i > valueStart && buf[i] !== 0x7d) i--    // skip trailing envelope fields (,"id":1)
  if (i <= valueStart) return buf.subarray(valueStart)

  return buf.subarray(valueStart, i + 1)  // zero-copy slice (shared memory!)
}

export function analyzeTraceFromBuffer(
  mod: WasmModule,
  traceBytes: Uint8Array,
  estimatorAddress: string,
  blockNumber: bigint | null
): AnalyzeTraceResult {
  const exports = mod.getWasmExports()

  // Allocate and write trace bytes into WASM memory
  const tracePtr = exports.__wbindgen_malloc(traceBytes.length, 1)
  new Uint8Array(exports.memory.buffer).set(traceBytes, tracePtr)

  // Allocate and write estimator address (re-get view after malloc — memory may have grown)
  const addrBytes = new TextEncoder().encode(estimatorAddress)
  const addrPtr = exports.__wbindgen_malloc(addrBytes.length, 1)
  new Uint8Array(exports.memory.buffer).set(addrBytes, addrPtr)

  // Call raw WASM — same signature as generated passStringToWasm0 produces
  const hasBlock = blockNumber != null ? 1 : 0
  const block = blockNumber ?? BigInt(0)

  const ret = exports.analyze_trace(
    tracePtr, traceBytes.length,
    addrPtr, addrBytes.length,
    hasBlock, block
  )

  // DO NOT call __wbindgen_free — dlmalloc tracks chunk sizes internally
  // and passing the requested byte length (not the actual chunk size) causes
  // the "psize <= size + max_overhead" panic. WASM memory never shrinks so
  // this is a safe leak — it gets reclaimed when the WASM instance resets.

  // Unpack the externref result table entries
  const table = exports.__wbindgen_externrefs
  const dealloc = exports.__externref_table_dealloc

  if (ret[2]) {
    const err = table.get(ret[1])
    dealloc(ret[1])
    throw err
  }

  const result = table.get(ret[0])
  dealloc(ret[0])
  return result as AnalyzeTraceResult
}

export function formatGas(gas: number): string {
  return gas.toLocaleString()
}

export const SAMPLE_TRACE = JSON.stringify(
  {
    failed: false,
    gas: 100000,
    returnValue: "0x",
    structLogs: [
      {
        pc: 100,
        op: "SSTORE",
        gas: 90000,
        gasCost: 5000,
        depth: 1,
        stack: [
          "0x00000000000000000000000000000000000000000000000000000000000000ff",
          "0x0000000000000000000000000000000000000000000000000000000000000001",
        ],
        memory: [],
      },
    ],
  },
  null,
  2
)

export const DEFAULT_ESTIMATOR_ADDRESS = "0xd682Fe2ee8bdd59fdcCc5a4962FD98c20Ef47290"
