import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error(
    "BACKEND_URL is required (no localhost fallback). Set it in the environment before building.",
  );
}

type Redirect = NonNullable<Awaited<ReturnType<NonNullable<NextConfig["redirects"]>>>>[number];

const permanent = (source: string, destination: string, has?: Redirect["has"]): Redirect => ({
  source,
  destination,
  permanent: true,
  ...(has ? { has } : {}),
});

/** Old KAYOU paths → K-YOU routes, for one release (contract §7). 05–08 add rows through PROGRESS.md. */
const legacyRedirects: Redirect[] = [
  // /services stays the category grid; only a query string means "search".
  permanent("/services", "/rechercher", [{ type: "query", key: "q" }]),
  permanent("/services", "/rechercher", [{ type: "query", key: "city" }]),
  permanent("/services", "/rechercher", [{ type: "query", key: "category" }]),
  permanent("/categories/:slug", "/rechercher?category=:slug"),
  permanent("/providers/:id", "/prestataire/:id"),
  permanent("/book/:id", "/prestataire/:id"),
  permanent("/review/:id", "/prestataire/:id"),
  permanent("/auth", "/register", [{ type: "query", key: "mode", value: "signup" }]),
  permanent("/auth", "/login"),
  permanent("/pro/onboarding", "/prestataire/nouveau"),
  permanent("/pro", "/mon-espace"),
  permanent("/dashboard/provider", "/mon-espace"),
  permanent("/pro/earnings", "/revenus"),
  permanent("/pro/verify", "/verification"),
  permanent("/pro/profile/:rest*", "/compte"),
  permanent("/dashboard", "/mes-reservations"),
  permanent("/dashboard/client", "/mes-reservations"),
  permanent("/bookings", "/mes-reservations"),
  permanent("/bookings/:id", "/reservation/:id"),
  permanent("/messages", "/messagerie"),
  permanent("/dashboard/settings", "/compte"),
  permanent("/dashboard/admin", "/admin"),
  permanent("/dashboard/admin/:rest*", "/admin"),
  permanent("/quotes/:rest*", "/mes-reservations"),
  permanent("/pro/requests", "/mes-reservations"),
  permanent("/pro/devis/:rest*", "/mes-reservations"),
];

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
  async redirects() {
    return legacyRedirects;
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
