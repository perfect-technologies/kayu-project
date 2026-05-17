import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error(
    "BACKEND_URL is required (no localhost fallback). Set it in the environment before building.",
  );
}

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  transpilePackages: ["@kayu/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "via.placeholder.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "*.tile.openstreetmap.org", pathname: "/**" },
      { protocol: "https", hostname: "tile.openstreetmap.org", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
