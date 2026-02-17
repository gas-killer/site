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

export async function fetchTraceFromRpc(rpcUrl: string, txHash: string): Promise<string> {
  const resp = await fetch(rpcUrl, {
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
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
  }

  const json = await resp.json()
  if (json.error) {
    throw new Error(`RPC error: ${json.error.message || JSON.stringify(json.error)}`)
  }

  return JSON.stringify(json.result)
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
