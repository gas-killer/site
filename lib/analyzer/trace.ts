import "server-only"

export const DEFAULT_ESTIMATOR_ADDRESS = "0xd682Fe2ee8bdd59fdcCc5a4962FD98c20Ef47290"

const RPC_URLS: Record<string, string | undefined> = {
  ethereum: process.env.RPC_ETHEREUM,
  sepolia: process.env.RPC_SEPOLIA,
}

// The route has 60s in all; the struct-log trace gets whatever its deadline leaves.
const RECEIPT_TIMEOUT_MS = 8_000
const PRESTATE_TIMEOUT_MS = 6_000
// An analysis holds the trace's bytes, its decoded text and about 2.5x its size in wasm memory, so
// about 4.5x in all. With one trace in flight per instance, a 300MB trace peaks near 1.35GB, which
// leaves room for the runtime in a Hobby function's 2GB.
const MAX_TRACE_BYTES = 300_000_000
// The prestate tracers grow with the storage a call touches, not its steps; anything past this
// belongs on the struct-log path's cap and lock.
const MAX_PRESTATE_BYTES = 20_000_000

/** A failure the page can show as-is. */
export class AnalyzerError extends Error {
  constructor(readonly status: number, message: string, readonly code?: string) {
    super(message)
  }
}

const TRACE_TOO_LARGE = "trace_too_large"

/** `cause` is logged so a provider's response cap can be told apart from our own when tuning either. */
export function traceTooLarge(cause: string): AnalyzerError {
  console.warn("analyzer trace too large:", cause)
  return new AnalyzerError(413, "This transaction's trace is too large to analyze here.", TRACE_TOO_LARGE)
}

export function rpcUrlFor(network: string): string {
  const url = RPC_URLS[network]
  if (!url) throw new AnalyzerError(400, `RPC not configured for network: ${network}`)
  return url
}

async function rpc(url: string, method: string, params: unknown[], timeoutMs: number): Promise<Response> {
  let resp: Response
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new AnalyzerError(504, "The RPC node took too long to respond. Try again.")
    }
    throw new AnalyzerError(502, "Upstream RPC request failed")
  }
  if (resp.status === 413) throw traceTooLarge("RPC returned HTTP 413")
  if (!resp.ok) throw new AnalyzerError(502, `Upstream RPC returned HTTP ${resp.status}`)
  return resp
}

export type TransactionInfo = {
  blockNumber: bigint
  from: string
  // The called contract, or the deployed one for a creation; used for re-entry detection.
  to: string | null
  gasUsed: number
  effectiveGasPrice: bigint
}

export async function fetchTransactionInfo(url: string, txHash: string): Promise<TransactionInfo> {
  const json = await (await rpc(url, "eth_getTransactionReceipt", [txHash], RECEIPT_TIMEOUT_MS)).json()
  if (json.error) throw new AnalyzerError(502, `RPC error: ${json.error.message || JSON.stringify(json.error)}`)
  if (!json.result) throw new AnalyzerError(404, "Transaction not found")
  return {
    blockNumber: BigInt(json.result.blockNumber),
    from: json.result.from,
    to: json.result.to ?? json.result.contractAddress ?? null,
    gasUsed: Number(json.result.gasUsed),
    effectiveGasPrice: BigInt(json.result.effectiveGasPrice ?? 0),
  }
}

export type PrestateTraces = { diff: string; frame: string }

/** The prestateTracer diff and callTracer frame, as JSON for analyze_prestate. */
export async function fetchPrestateTraces(url: string, txHash: string): Promise<PrestateTraces> {
  const [diff, frame] = await Promise.all([
    tracerResult(url, txHash, { tracer: "prestateTracer", tracerConfig: { diffMode: true } }),
    tracerResult(url, txHash, { tracer: "callTracer", tracerConfig: { withLog: true } }),
  ])
  return { diff, frame }
}

async function tracerResult(url: string, txHash: string, config: object): Promise<string> {
  const resp = await rpc(url, "debug_traceTransaction", [txHash, config], PRESTATE_TIMEOUT_MS)
  const json = JSON.parse(new TextDecoder().decode(await readCapped(resp, MAX_PRESTATE_BYTES)))
  if (json.error) throw new AnalyzerError(502, `RPC error: ${json.error.message || JSON.stringify(json.error)}`)
  if (!json.result) throw new AnalyzerError(502, "Unexpected RPC response format")
  return JSON.stringify(json.result)
}

/** The raw debug_traceTransaction response, undecoded: it can run past 100MB, and the worker decodes it. */
export async function fetchTrace(url: string, txHash: string, timeoutMs: number): Promise<Uint8Array> {
  const resp = await rpc(url, "debug_traceTransaction", [txHash, { enableMemory: true }], timeoutMs)
  return readCapped(resp, MAX_TRACE_BYTES)
}

async function readCapped(resp: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(resp.headers.get("content-length")) || 0
  if (declared > maxBytes) {
    await resp.body?.cancel()
    throw traceTooLarge(`content-length ${declared} is over our ${maxBytes}-byte cap`)
  }
  if (!resp.body) return new Uint8Array()
  const reader = resp.body.getReader()
  // With a declared length the bytes land in one buffer as they arrive, rather than being held twice
  // while chunks are joined.
  let buffer = declared > 0 ? new Uint8Array(declared) : null
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (size + value.byteLength > maxBytes) {
        await reader.cancel()
        throw traceTooLarge(`body passed our ${maxBytes}-byte cap`)
      }
      if (buffer && size + value.byteLength <= buffer.byteLength) buffer.set(value, size)
      else {
        if (buffer) chunks.push(buffer.subarray(0, size))
        buffer = null
        chunks.push(value)
      }
      size += value.byteLength
    }
  } catch (e) {
    if (e instanceof AnalyzerError) throw e
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new AnalyzerError(504, "The RPC node took too long to respond. Try again.")
    }
    throw new AnalyzerError(502, "Upstream RPC request failed")
  }
  if (buffer) return size === buffer.byteLength ? buffer : buffer.slice(0, size)
  // Not Buffer.concat: a small result can share Node's buffer pool, which must not be transferred.
  const joined = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return joined
}
