export interface Callee {
  address: string
  // Gas the transaction's calls into this contract used, summed over every call to it.
  gasUsed: number
}

// The most contracts one nested analysis prices as owned.
export const MAX_OWNED = 20

const ADDRESS = /^0x[0-9a-fA-F]{40}$/
// Precompiles sit at the low end of the address space and can't integrate anything.
const PRECOMPILE_CEILING = 0x10000n

type CallFrame = { type?: string; to?: string; gasUsed?: string; calls?: CallFrame[] }

/**
 * The contracts a transaction CALLs, besides `root`, that could settle as nested frames, from its
 * callTracer frame: the most gas first. A call that used no gas ran no code, so its target can't
 * integrate the SDK.
 */
export function calleesFromCallFrame(frameJson: string, root: string): Callee[] {
  const gas = new Map<string, number>()
  const walk = (frame: CallFrame) => {
    for (const call of frame.calls ?? []) {
      const to = call.to?.toLowerCase()
      const used = Number(call.gasUsed ?? 0)
      if (call.type === "CALL" && to && ADDRESS.test(to) && to !== root.toLowerCase() && used > 0) {
        if (BigInt(to) >= PRECOMPILE_CEILING) gas.set(to, (gas.get(to) ?? 0) + used)
      }
      walk(call)
    }
  }
  walk(JSON.parse(frameJson) as CallFrame)
  return [...gas].map(([address, gasUsed]) => ({ address, gasUsed })).sort((a, b) => b.gasUsed - a.gasUsed)
}

/** A request's owned contracts: 1 to MAX_OWNED distinct addresses, lowercased, or null if invalid. */
export function parseOwned(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  if (!value.every((a): a is string => typeof a === "string" && ADDRESS.test(a))) return null
  const owned = [...new Set(value.map((a) => a.toLowerCase()))]
  return owned.length <= MAX_OWNED ? owned : null
}
