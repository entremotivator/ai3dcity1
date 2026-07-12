/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/wp-json/:path*",
        destination: "https://entremotivator.com/wp-json/:path*",
      },
    ]
  },
}

export default nextConfig
