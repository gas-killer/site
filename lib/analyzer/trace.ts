import "server-only"

export const DEFAULT_ESTIMATOR_ADDRESS = "0xd682Fe2ee8bdd59fdcCc5a4962FD98c20Ef47290"

const RPC_URLS: Record<string, string | undefined> = {
  ethereum: process.env.RPC_ETHEREUM,
  gnosis: process.env.RPC_GNOSIS,
  sepolia: process.env.RPC_SEPOLIA,
}

// Archive nodes can take a while to replay a large transaction, but the route has 60s in all.
const RPC_TIMEOUT_MS = 40_000

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

async function rpc(url: string, method: string, params: unknown[]): Promise<Response> {
  let resp: Response
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      cache: "no-store",
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
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
  const json = await (await rpc(url, "eth_getTransactionReceipt", [txHash])).json()
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

/** The trace's JSON text, left unparsed: it can run past 100MB. */
export async function fetchTrace(url: string, txHash: string): Promise<string> {
  const text = await (await rpc(url, "debug_traceTransaction", [txHash, { enableMemory: true }])).text()

  // Check for "result" first because "error" can appear as a key inside trace data (e.g. revert reasons).
  const resultMatch = text.match(/"result"\s*:\s*/)
  if (resultMatch?.index !== undefined) {
    return extractValueFromEnvelope(text, resultMatch.index + resultMatch[0].length)
  }

  const errorMatch = text.match(/"error"\s*:\s*/)
  if (errorMatch?.index !== undefined) {
    let message = "RPC returned an error response"
    try {
      const error = JSON.parse(extractValueFromEnvelope(text, errorMatch.index + errorMatch[0].length))
      message = `RPC error: ${error.message || JSON.stringify(error)}`
    } catch {}
    throw new AnalyzerError(502, message)
  }

  throw new AnalyzerError(502, "Unexpected RPC response format")
}

/**
 * Extract a JSON value from a JSON-RPC envelope given the index where the value starts.
 *
 * The envelope looks like: {"jsonrpc":"2.0","id":1,"result":{...}}
 * After locating "result": we know valueStart points to the '{' of the value.
 * We scan backwards from the end of the text to skip the envelope's closing '}'
 * and any trailing fields (e.g. ,"id":1), then find the '}' that closes the value.
 *
 * This is O(k) where k is the length of any trailing envelope fields (typically < 50 chars),
 * not O(n) for the full response.
 */
function extractValueFromEnvelope(text: string, valueStart: number): string {
  // This extraction only works for object values (starting with '{').
  // debug_traceTransaction always returns an object; RPC errors are always objects.
  if (text[valueStart] !== '{') {
    return text.slice(valueStart).trim()
  }

  let i = text.length - 1

  // Skip trailing whitespace
  while (i > valueStart && text.charCodeAt(i) <= 32) i--

  // This should be the envelope's closing '}'
  if (text[i] !== '}') {
    return text.slice(valueStart).trim()
  }

  // Step inside the envelope
  i--

  // Skip any trailing envelope fields (e.g. ,"id":1) by scanning backwards
  // for the next '}'. These fields contain only simple JSON values (numbers,
  // short strings like "2.0"), never nested braces.
  while (i > valueStart && text[i] !== '}') i--

  if (i <= valueStart) {
    return text.slice(valueStart).trim()
  }

  // text[i] is the '}' that closes the result/error value
  return text.slice(valueStart, i + 1)
}
