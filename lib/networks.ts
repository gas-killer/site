export type Network = {
  id: string
  name: string
  rpcUrl: string | undefined
}

export const NETWORKS: Network[] = [
  { id: "ethereum", name: "Ethereum", rpcUrl: process.env.NEXT_PUBLIC_RPC_ETHEREUM },
  { id: "gnosis", name: "Gnosis", rpcUrl: process.env.NEXT_PUBLIC_RPC_GNOSIS },
  { id: "sepolia", name: "Sepolia", rpcUrl: process.env.NEXT_PUBLIC_RPC_SEPOLIA },
].filter((n) => n.rpcUrl) as (Network & { rpcUrl: string })[]
