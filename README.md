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

## Building WASM from Source

The analyzer runs the published `@gas-killer/analyzer-wasm`. To try unreleased Rust changes, build a local `gas-analyzer` checkout and install it in place of the published package:

```bash
# Requires: rustup, wasm-pack
wasm-pack build ../gas-analyzer/crates/wasm --target web --release --out-name gas_killer_wasm
npm install --no-save @gas-killer/analyzer-wasm@file:../gas-analyzer/crates/wasm/pkg
```

`--no-save` leaves `package.json` and the lockfile on the published version, and a plain `npm install` switches back to it.
