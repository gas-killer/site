export function formatGas(gas: number): string {
  return gas.toLocaleString()
}

/**
 * Whether at least half of a transaction's gas was spent inside the contracts it called. Those calls run
 * natively when Gas Killer settles, so that gas can't be saved, and it, not verification, is why such a
 * transaction shows no savings.
 */
export function mostGasInCallees(nativeCallGas: number, gasUsed: number): boolean {
  return gasUsed > 0 && nativeCallGas * 2 >= gasUsed
}
