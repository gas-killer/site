export type Network = {
  id: string
  name: string
  explorer: string
  nativeSymbol: string
}

export const NETWORKS: Network[] = [
  { id: "ethereum", name: "Ethereum", explorer: "https://etherscan.io", nativeSymbol: "ETH" },
  { id: "sepolia", name: "Sepolia", explorer: "https://sepolia.etherscan.io", nativeSymbol: "SepoliaETH" },
]
