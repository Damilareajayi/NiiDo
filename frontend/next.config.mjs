/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
  // Next.js's default Cache-Control for prerendered pages is
  // "s-maxage=31536000, stale-while-revalidate" — a full year, on the
  // assumption that a CDN ties its cache key to the deployment/build ID
  // the way Vercel's does, so a new deploy is automatically a cache miss.
  // We're proxied through Firebase Hosting's CDN (Fastly) instead, which
  // has no concept of Next.js build IDs — it just honors the header
  // literally, so it kept serving a year-old HTML shell (pointing at
  // year-old JS chunk hashes) straight through multiple real deploys.
  // Hashed /_next/static/* assets are genuinely immutable and are
  // excluded below so they keep their long-lived cache.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
