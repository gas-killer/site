import "server-only"

/** The network's native token in USD, or null when there's no meaningful price (a testnet) or it can't be fetched. */
export async function usdPrice(network: string): Promise<number | null> {
  if (network !== "ethereum") return null
  try {
    const resp = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3_000),
    })
    if (!resp.ok) return null
    const amount = Number((await resp.json())?.data?.amount)
    return Number.isFinite(amount) && amount > 0 ? amount : null
  } catch {
    return null
  }
}
