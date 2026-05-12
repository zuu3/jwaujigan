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
    // assembly.go.kr 이미지 서버가 느려서 최적화 프록시가 타임아웃남 — unoptimized로 직접 서빙
    unoptimized: true,
  },
};

export default nextConfig;
