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

  // Extract the "result" field without parsing the entire response.
  // JSON-RPC envelope is: {"jsonrpc":"2.0","id":1,"result":{...}} or {"jsonrpc":"2.0","id":1,"error":{...}}
  // We find the "result": or "error": key and extract the value substring.
  const errorMatch = text.match(/"error"\s*:\s*/)
  if (errorMatch && errorMatch.index !== undefined) {
    // Try to parse just the error portion
    try {
      const errorStart = errorMatch.index + errorMatch[0].length
      const errorJson = JSON.parse(text.slice(errorStart).replace(/\}\s*$/, ""))
      throw new Error(`RPC error: ${errorJson.message || JSON.stringify(errorJson)}`)
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("RPC error:")) throw e
      throw new Error("RPC returned an error response")
    }
  }

  const resultMatch = text.match(/"result"\s*:\s*/)
  if (!resultMatch || resultMatch.index === undefined) {
    throw new Error("Unexpected RPC response format")
  }

  // Slice from the start of the result value to the end, trimming the outer closing brace
  const resultStart = resultMatch.index + resultMatch[0].length
  const resultJson = text.slice(resultStart).replace(/\}\s*$/, "")

  return resultJson
}

export function extractOriginalGas(json: string): number | null {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed.gas === "number") return parsed.gas
  } catch {
    // ignore
  }
  return null
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
