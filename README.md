# Gas Killer Site

[![Next.js](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org)
[![WASM](https://img.shields.io/badge/wasm-gas--killer--wasm-blue.svg)](https://github.com/gas-killer/gas-analyzer/pkgs/npm/gas-killer-wasm)

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

## Auth Token

The WASM package (`@gas-killer/gas-killer-wasm`) is hosted on GitHub Packages as a private package and requires authentication to install via `npm install`.

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Generate a token with the **`read:packages`** scope
3. Set it as `NPM_TOKEN` in your `.env` file

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NPM_TOKEN` | Yes | GitHub classic PAT with `read:packages` — required for `npm install` |
| `RPC_ETHEREUM` | No | Ethereum mainnet RPC URL |
| `RPC_GNOSIS` | No | Gnosis Chain RPC URL |
| `RPC_SEPOLIA` | No | Sepolia testnet RPC URL |

RPC URLs are used server-side only and are never exposed to the browser. At least one must be set for the analyzer to function.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Copy WASM assets and start the dev server |
| `npm run build` | Copy WASM assets and build for production |
| `npm run copy:wasm` | Copy WASM files from `node_modules` to `public/wasm/` |
| `npm run build:wasm` | Compile WASM from source (requires Rust + wasm-pack) and copy |

## Building WASM from Source

If you're making changes to the Rust analyzer, you can recompile the WASM locally instead of using the published package. By default this expects `gas-analyzer` to be a sibling of this repo:

```bash
# Requires: rustup, wasm-pack
npm run build:wasm

# Or point to a custom path
GAS_ANALYZER_WASM_PATH=/path/to/gas-analyzer/crates/wasm npm run build:wasm
```
