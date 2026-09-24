import { createMDX } from "fumadocs-mdx/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // TODO: remove if using Vercel Image Optimization
  },
  // `curl -fsSL https://gaskiller.xyz/bash | sh` — the gkvm toolchain installer (gk-run,
  // gk-anvil, the `gk` command, the guest toolchain image). The script lives in
  // gas-killer/gas-analyzer (install-gk.sh); this is only its short name. 307, so the
  // destination can move (→ main once the gkvm work lands) without anyone caching it.
  async redirects() {
    const installer =
      "https://raw.githubusercontent.com/gas-killer/gas-analyzer/RonTuretzky/gkvm-m6-host/install-gk.sh"
    return [
      { source: "/bash", destination: installer, permanent: false },
      { source: "/install.sh", destination: installer, permanent: false },
    ]
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
