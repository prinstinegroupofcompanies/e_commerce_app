import withPWA from "next-pwa";

const withPWAConfigured = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

function hostnameFromEnv(name) {
  try {
    const raw = process.env[name];
    if (!raw) return null;
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const imageHosts = new Set(["images.unsplash.com"]);
for (const key of ["NEXT_PUBLIC_APP_URL", "RENDER_BACKEND_URL"]) {
  const host = hostnameFromEnv(key);
  if (host) imageHosts.add(host);
}

const backend = process.env.RENDER_BACKEND_URL?.replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [...imageHosts].flatMap((hostname) => [
      { protocol: "https", hostname },
      { protocol: "http", hostname },
    ]),
  },
  async rewrites() {
    if (!backend) return [];
    // Keep /api/auth and other local API routes on Vercel (filesystem wins over fallback).
    // Proxy uploads API + static files to Render for persistent disk storage.
    return {
      beforeFiles: [
        { source: "/api/upload", destination: `${backend}/api/upload` },
      ],
      fallback: [
        { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
      ],
    };
  },
};

export default withPWAConfigured(nextConfig);
