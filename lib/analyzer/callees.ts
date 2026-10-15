export interface Callee {
  address: string
  // Gas this contract's own code used across every call to it, including its delegatecalls and precompile
  // calls but not the contracts it calls, so no gas counts toward two callees.
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
  const rootAddress = root.toLowerCase()
  const gas = new Map<string, number>()
  // `owner` is the callee whose CALL this frame runs under, or null under the root.
  const walk = (frame: CallFrame, owner: string | null) => {
    // The tracer's gasUsed includes every subcall's; each subcall credits its own share instead.
    let own = Number(frame.gasUsed ?? 0)
    for (const call of frame.calls ?? []) {
      own -= Number(call.gasUsed ?? 0)
      const to = call.to?.toLowerCase()
      // Only a CALL can settle as a nested frame. Everything else a callee runs, its view calls, delegatecalls,
      // precompiles and creations, goes away with it when it settles, so that gas stays with it.
      const opensFrame = call.type === "CALL" && !!to && ADDRESS.test(to) && !isPrecompile(to)
      walk(call, opensFrame ? (to === rootAddress ? null : to) : owner)
    }
    if (owner) gas.set(owner, (gas.get(owner) ?? 0) + own)
  }
  walk(JSON.parse(frameJson) as CallFrame, null)
  return [...gas]
    .filter(([, gasUsed]) => gasUsed > 0)
    .map(([address, gasUsed]) => ({ address, gasUsed }))
    .sort((a, b) => b.gasUsed - a.gasUsed)
}

function isPrecompile(address: string): boolean {
  return ADDRESS.test(address) && BigInt(address) < PRECOMPILE_CEILING
}

/** A request's owned contracts: 1 to MAX_OWNED distinct addresses, lowercased, or null if invalid. */
export function parseOwned(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  if (!value.every((a): a is string => typeof a === "string" && ADDRESS.test(a))) return null
  const owned = [...new Set(value.map((a) => a.toLowerCase()))]
  return owned.length <= MAX_OWNED ? owned : null
}

/** The addresses in a typed list, split on commas and whitespace, lowercased and distinct, and the entries that aren't addresses. */
export function parseAddressList(text: string): { addresses: string[]; invalid: string[] } {
  const entries = text.split(/[\s,]+/).filter(Boolean)
  return {
    addresses: [...new Set(entries.filter((e) => ADDRESS.test(e)).map((e) => e.toLowerCase()))],
    invalid: entries.filter((e) => !ADDRESS.test(e)),
  }
}
