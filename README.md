# Gas Killer Site

[![Next.js](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org)
[![WASM](https://img.shields.io/badge/wasm-analyzer--wasm-blue.svg)](https://www.npmjs.com/package/@gas-killer/analyzer-wasm)

Frontend for the Gas Killer analyzer. Users submit an Ethereum transaction hash, the server fetches its trace via a proxied RPC call, and the gas analysis runs client-side in a WASM module.

## Quick Start

### Prerequisites

- Node.js 20+
- A GitHub classic PAT with `read:packages` scope (see [Auth Token](#auth-token))

### Setup

1. **Configure environment:**
```bash
cp .env.example .env
```

2. **Add your auth token to `.env`:**
```bash
NPM_TOKEN=ghp_...
```

3. **Install and run:**
```bash
npm install
npm run dev
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RPC_ETHEREUM` | No | Ethereum mainnet RPC URL |
| `RPC_GNOSIS` | No | Gnosis Chain RPC URL |
| `RPC_SEPOLIA` | No | Sepolia testnet RPC URL |

RPC URLs are used server-side only and are never exposed to the browser: `/api/analyze` fetches the trace and runs the WASM analyzer on the server. At least one must be set for the analyzer to function.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run build:wasm` | Compile WASM from source (requires Rust + wasm-pack) into `node_modules`; `npm install` restores the published build |

## Building WASM from Source

If you're making changes to the Rust analyzer, you can recompile the WASM locally instead of using the published package. By default this expects `gas-analyzer` to be a sibling of this repo:

```bash
# Requires: rustup, wasm-pack
npm run build:wasm

# Or point to a custom path
GAS_ANALYZER_WASM_PATH=/path/to/gas-analyzer/crates/wasm npm run build:wasm
```
