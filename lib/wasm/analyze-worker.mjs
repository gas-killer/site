// Runs one analysis off the main thread: the analyzer is synchronous and can take seconds on a big
// trace. Turbopack bundles this as its own entry from the `new Worker` call in lib/wasm/analyzer.ts.
import { parentPort, workerData } from "node:worker_threads"
import { analyze_prestate, analyze_trace_bytes, initSync } from "@gas-killer/analyzer-wasm"

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
  // Takes the whole JSON-RPC response, so a trace past the JS string limit still parses.
  return guarded(() => ({
    ok: true,
    result: analyze_trace_bytes(bytes, estimatorAddress, callerAddress, blockNumber, originAddress),
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
    // The node's own error in place of a trace; a provider's response size limit has its own name.
    if (e instanceof Error && e.name === "TraceTooLargeError") return { ok: false, kind: "too_large", message: e.message }
    if (e instanceof Error && e.name === "RpcError") return { ok: false, kind: "rpc", message: `RPC error: ${e.message}` }
    return { ok: false, kind: "analysis", message: e instanceof Error ? e.message : String(e) }
  }
}

parentPort.postMessage(run())
