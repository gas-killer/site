import { createMDX } from "fumadocs-mdx/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // TODO: remove if using Vercel Image Optimization
  },
  // The analyzer reads its .wasm by path, so tracing can't find it alone.
  outputFileTracingIncludes: {
    "/api/analyze": ["./node_modules/@gas-killer/analyzer-wasm/gas_killer_wasm_bg.wasm"],
    "/api/analyze/nested": ["./node_modules/@gas-killer/analyzer-wasm/gas_killer_wasm_bg.wasm"],
    // The share card's font and wordmark, read by path in lib/share-card.tsx.
    "/share/**": ["./public/fonts/*", "./public/brand/gk-wordmark-transparent.png"],
  },
  // `curl -fsSL https://gaskiller.xyz/bash | sh` — the gkvm toolchain installer (gk-run,
  // gk-anvil, the `gk` command, the guest toolchain image). The script lives in
  // gas-killer/gas-analyzer (install-gk.sh); this is only its short name. 307, so the
  // destination can move (→ main once the gkvm work lands) without anyone caching it.
  async redirects() {
    const installer =
      "https://raw.githubusercontent.com/gas-killer/gas-analyzer/RonTuretzky/gkvm-m6-host/install-gk.sh"
    // The private ETH demo (gas-killer/anon) is its own Vercel app with its own API routes, so it is linked, not
    // proxied under /anon. 307 too: it moves to anon.gaskiller.xyz once that domain's DNS record is in.
    const anon = "https://gas-killer-anon.vercel.app"
    return [
      { source: "/bash", destination: installer, permanent: false },
      { source: "/install.sh", destination: installer, permanent: false },
      { source: "/anon", destination: anon, permanent: false },
    ]
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
