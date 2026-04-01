/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // TODO: remove if using Vercel Image Optimization
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig