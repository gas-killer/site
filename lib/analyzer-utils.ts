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

export async function fetchTraceFromRpc(network: string, txHash: string): Promise<string> {
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

  // Use text() instead of json() to handle very large responses (100MB+)
  // that can crash the browser's JSON parser with "Unexpected end of JSON input"
  const text = await resp.text()

  // Extract the "result" or "error" value from the JSON-RPC envelope without
  // parsing the entire response. Check for "result" first because "error" can
  // appear as a key inside trace data (e.g. revert reasons).
  const resultMatch = text.match(/"result"\s*:\s*/)
  if (resultMatch && resultMatch.index !== undefined) {
    const resultStart = resultMatch.index + resultMatch[0].length
    return extractValueFromEnvelope(text, resultStart)
  }

  // No "result" found — check for a JSON-RPC error response
  const errorMatch = text.match(/"error"\s*:\s*/)
  if (errorMatch && errorMatch.index !== undefined) {
    try {
      const errorStart = errorMatch.index + errorMatch[0].length
      const errorValue = extractValueFromEnvelope(text, errorStart)
      const errorJson = JSON.parse(errorValue)
      throw new Error(`RPC error: ${errorJson.message || JSON.stringify(errorJson)}`)
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("RPC error:")) throw e
      throw new Error("RPC returned an error response")
    }
  }

  throw new Error("Unexpected RPC response format")
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
  // short strings like "2.0") — never nested braces.
  while (i > valueStart && text[i] !== '}') i--

  if (i <= valueStart) {
    return text.slice(valueStart).trim()
  }

  // text[i] is the '}' that closes the result/error value
  return text.slice(valueStart, i + 1)
}

export function extractOriginalGas(json: string): number | null {
  // Extract the top-level "gas" field via regex instead of JSON.parse,
  // since the trace string can be 100MB+ and would crash the browser.
  // The top-level gas field appears in the first few hundred bytes,
  // before structLogs, so we limit the search to avoid matching
  // per-opcode gas fields deep in the trace.
  const prefix = json.slice(0, 500)
  const match = prefix.match(/"gas"\s*:\s*(\d+)/)
  return match ? Number(match[1]) : null
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
