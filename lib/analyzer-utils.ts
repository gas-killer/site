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

/** Percent of `gasUsed` that settling for `estimate` saves; negative when it costs more. */
export function savedPercent(gasUsed: number, estimate: number): number {
  return gasUsed > 0 ? ((gasUsed - estimate) / gasUsed) * 100 : 0
}

export function shareText(percent: number): string {
  return `I could cut this transaction's gas by ${Math.round(percent)}% with Gas Killer.`
}

/** Gas at `gasPrice` wei, in the native token, to three significant digits. */
export function formatNative(gas: number, gasPrice: string, symbol?: string): string {
  const native = Number(BigInt(gas) * BigInt(gasPrice)) / 1e18
  return `${native.toLocaleString(undefined, { maximumSignificantDigits: 3 })} ${symbol ?? ""}`.trim()
}
