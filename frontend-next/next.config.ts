import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/@:name",
        destination: "/user/:name",
      },
      {
        source: "/@:name/:block",
        destination: "/user/:name/:block",
      },
    ]
  },
  output: "standalone",
}

export default nextConfig
