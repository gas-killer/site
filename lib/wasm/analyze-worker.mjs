// Runs one analysis off the main thread: analyze_trace is synchronous and can take seconds on a big
// trace. Turbopack bundles this as its own entry from the `new Worker` call in lib/wasm/analyzer.ts.
import { parentPort, workerData } from "node:worker_threads"
import { analyze_trace, initSync } from "@gas-killer/analyzer-wasm"

const { module, bytes, estimatorAddress, callerAddress, blockNumber, originAddress } = workerData

function run() {
  const text = new TextDecoder().decode(bytes)

  // Check for "result" first because "error" can appear as a key inside trace data (e.g. revert reasons).
  const resultMatch = text.match(/"result"\s*:\s*/)
  if (resultMatch?.index === undefined) {
    const errorMatch = text.match(/"error"\s*:\s*/)
    if (errorMatch?.index === undefined) return { ok: false, kind: "rpc", message: "Unexpected RPC response format" }
    try {
      const error = JSON.parse(extractValueFromEnvelope(text, errorMatch.index + errorMatch[0].length))
      return { ok: false, kind: "rpc", message: `RPC error: ${error.message || JSON.stringify(error)}` }
    } catch {
      return { ok: false, kind: "rpc", message: "RPC returned an error response" }
    }
  }
  const trace = extractValueFromEnvelope(text, resultMatch.index + resultMatch[0].length)

  initSync({ module })
  try {
    return { ok: true, result: analyze_trace(trace, estimatorAddress, callerAddress, blockNumber, originAddress) }
  } catch (e) {
    // A panic or abort traps rather than returning an error, and its message ("unreachable") means nothing to users.
    if (e instanceof WebAssembly.RuntimeError) return { ok: false, kind: "crashed", message: `wasm trap: ${e.message}` }
    return { ok: false, kind: "analysis", message: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Extract a JSON value from a JSON-RPC envelope given the index where the value starts.
 *
 * The envelope looks like: {"jsonrpc":"2.0","id":1,"result":{...}}
 * Scanning back from the end skips the envelope's closing '}' and any trailing fields (e.g. ,"id":1)
 * to find the '}' that closes the value, so this is O(trailing fields), not O(n) for the full response.
 */
function extractValueFromEnvelope(text, valueStart) {
  // Only object values are handled: debug_traceTransaction always returns one, and RPC errors are objects.
  if (text[valueStart] !== "{") return text.slice(valueStart).trim()

  let i = text.length - 1
  while (i > valueStart && text.charCodeAt(i) <= 32) i--
  if (text[i] !== "}") return text.slice(valueStart).trim()

  // Step inside the envelope. Trailing fields hold only simple values, never nested braces.
  i--
  while (i > valueStart && text[i] !== "}") i--
  if (i <= valueStart) return text.slice(valueStart).trim()

  return text.slice(valueStart, i + 1)
}

parentPort.postMessage(run())
