export type Network = {
  id: string
  name: string
  explorer: string
  nativeSymbol: string
  // First block under Glamsterdam, which the analyzer's EVM predates; unset until the network schedules it.
  glamsterdamBlock?: bigint
}

export const NETWORKS: Network[] = [
  { id: "ethereum", name: "Ethereum", explorer: "https://etherscan.io", nativeSymbol: "ETH" },
  {
    id: "sepolia",
    name: "Sepolia",
    explorer: "https://sepolia.etherscan.io",
    nativeSymbol: "SepoliaETH",
    glamsterdamBlock: 11_856_337n,
  },
]

export function ranUnderGlamsterdam(network: Network | undefined, blockNumber: string): boolean {
  return network?.glamsterdamBlock !== undefined && BigInt(blockNumber) >= network.glamsterdamBlock
}
