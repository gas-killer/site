import "server-only"

export const DEFAULT_ESTIMATOR_ADDRESS = "0xd682Fe2ee8bdd59fdcCc5a4962FD98c20Ef47290"

const RPC_URLS: Record<string, string | undefined> = {
  ethereum: process.env.RPC_ETHEREUM,
  gnosis: process.env.RPC_GNOSIS,
  sepolia: process.env.RPC_SEPOLIA,
}

// The route has 60s in all; see its budget.
const RECEIPT_TIMEOUT_MS = 8_000
const TRACE_TIMEOUT_MS = 25_000
// An analysis holds the trace's bytes, its decoded text and about 2.5x its size in wasm memory. With
// one trace in flight per instance, a 200MB trace peaks near 900MB, within a Hobby function's 2GB.
const MAX_TRACE_BYTES = 200_000_000

/** A failure the page can show as-is. */
export class AnalyzerError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
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

/** The raw debug_traceTransaction response, undecoded: it can run past 100MB, and the worker decodes it. */
export async function fetchTrace(url: string, txHash: string): Promise<Uint8Array> {
  const resp = await rpc(url, "debug_traceTransaction", [txHash, { enableMemory: true }], TRACE_TIMEOUT_MS)
  return readCapped(resp, MAX_TRACE_BYTES)
}

async function readCapped(resp: Response, maxBytes: number): Promise<Uint8Array> {
  const tooLarge = () =>
    new AnalyzerError(413, `This transaction's trace is over ${maxBytes / 1e6} MB, too large to analyze here.`)
  const declared = Number(resp.headers.get("content-length")) || 0
  if (declared > maxBytes) {
    await resp.body?.cancel()
    throw tooLarge()
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
        throw tooLarge()
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
