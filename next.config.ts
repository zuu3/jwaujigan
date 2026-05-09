import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "open.assembly.go.kr",
      },
      {
        protocol: "https",
        hostname: "www.assembly.go.kr",
      },
    ],
  },
};

export default nextConfig;
