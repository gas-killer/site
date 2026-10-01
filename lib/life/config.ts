// Values shared by the /life page and its run route.

export const CHAIN_ID = 11155111;
export const LIFE_ADDRESS = "0x85Ca89c5D6fe362d8b7CDfE6C424EBCCC900Efed" as const;
/** Block the contract was deployed in; recent-run log scans start here. */
export const LIFE_DEPLOY_BLOCK = 11809264n;

export const ETHERSCAN = "https://sepolia.etherscan.io";

/** EIP-7825 (Fusaka): the most gas any single transaction may use. */
export const TX_GAS_CAP = 16_777_216;
/** Sepolia block gas limit at time of writing. */
export const BLOCK_GAS_LIMIT = 60_000_000;
/**
 * `step(n)` executed as a plain transaction, measured on a Sepolia fork (receipt gasUsed):
 * step(1) at generation 0, step(2) at generation 6 (run with the block gas limit lifted, since
 * it exceeds the per-transaction cap). Varies slightly with the number of live cells.
 */
export const NAIVE_GAS = { 1: 16_573_354, 2: 32_988_204 } as const;
export type Generations = keyof typeof NAIVE_GAS;

export const LIFE_ABI = [
  {
    type: "function",
    name: "getBoard",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "out", type: "uint256[16]" }],
  },
  {
    type: "function",
    name: "generation",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "step",
    stateMutability: "nonpayable",
    inputs: [{ name: "generations", type: "uint32" }],
    outputs: [],
  },
  {
    type: "event",
    name: "GenerationStepped",
    inputs: [
      { name: "generation", type: "uint256", indexed: true },
      { name: "boardHash", type: "bytes32", indexed: false },
    ],
  },
] as const;
