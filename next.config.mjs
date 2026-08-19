import { createMDX } from "fumadocs-mdx/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // TODO: remove if using Vercel Image Optimization
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
