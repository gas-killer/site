// Runs one analysis off the main thread: the analyzer is synchronous and can take seconds on a big
// trace. Turbopack bundles this as its own entry from the `new Worker` call in lib/wasm/analyzer.ts.
import { parentPort, workerData } from "node:worker_threads"
import { analyze_prestate, analyze_trace, initSync } from "@gas-killer/analyzer-wasm"

const { module, mode, estimatorAddress, callerAddress, blockNumber } = workerData

function run() {
  return mode === "prestate" ? runPrestate() : runTrace()
}

function runPrestate() {
  const { diff, frame, consumerAddress } = workerData
  return guarded(() => {
    const out = analyze_prestate(diff, frame, consumerAddress, estimatorAddress, callerAddress, blockNumber)
    // Nothing type-checks this .mjs against the package, so a changed result shape is reported as a crash,
    // which the route logs, rather than quietly falling back on every request.
    if (out?.eligible === true && out.result) return { ok: true, eligible: true, result: out.result }
    if (out?.eligible === false) return { ok: true, eligible: false, reason: String(out.reason) }
    return { ok: false, kind: "crashed", message: `unexpected analyze_prestate result: ${JSON.stringify(out)?.slice(0, 200)}` }
  })
}

function runTrace() {
  const { bytes, originAddress } = workerData
  const text = new TextDecoder().decode(bytes)

  // Check for "result" first because "error" can appear as a key inside trace data (e.g. revert reasons).
  const resultMatch = text.match(/"result"\s*:\s*/)
  if (resultMatch?.index === undefined) {
    const errorMatch = text.match(/"error"\s*:\s*/)
    if (errorMatch?.index === undefined) return { ok: false, kind: "rpc", message: "Unexpected RPC response format" }
    try {
      const error = JSON.parse(extractValueFromEnvelope(text, errorMatch.index + errorMatch[0].length))
      // Providers cap response size, and a trace with memory can pass it ("Response is too big",
      // "response size exceeds limit", "…larger than…").
      if (/too (big|large)|size exceeds|exceeds .*limit|larger than/i.test(error.message ?? "")) return { ok: false, kind: "too_large", message: error.message }
      return { ok: false, kind: "rpc", message: `RPC error: ${error.message || JSON.stringify(error)}` }
    } catch {
      return { ok: false, kind: "rpc", message: "RPC returned an error response" }
    }
  }
  const trace = extractValueFromEnvelope(text, resultMatch.index + resultMatch[0].length)

  return guarded(() => ({
    ok: true,
    result: analyze_trace(trace, estimatorAddress, callerAddress, blockNumber, originAddress),
  }))
}

function guarded(analyze) {
  const wasm = initSync({ module })
  // Wasm memory only grows, so its size afterwards is the analysis's peak; logged for tuning the trace cap.
  return { ...attempt(analyze), wasmBytes: wasm.memory.buffer.byteLength }
}

function attempt(analyze) {
  try {
    return analyze()
  } catch (e) {
    // A panic or abort traps rather than returning an error, and its message ("unreachable") means nothing to users.
    if (e instanceof WebAssembly.RuntimeError) return { ok: false, kind: "crashed", message: `wasm trap: ${e.message}` }
    // A missing export or a changed signature surfaces as a TypeError, not an analysis error.
    if (e instanceof TypeError) return { ok: false, kind: "crashed", message: `analyzer API mismatch: ${e.message}` }
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
