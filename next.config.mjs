import withPWA from "next-pwa";

const withPWAConfigured = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/app-build-manifest\.json$/],
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
for (const key of ["NEXT_PUBLIC_APP_URL", "RENDER_BACKEND_URL", "NEXT_PUBLIC_UPLOAD_BASE_URL"]) {
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
    // Serve uploaded files from Render persistent disk (upload API uses direct client → Render).
    return {
      fallback: [
        { source: "/api/media/:path*", destination: `${backend}/api/media/:path*` },
        { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
        { source: "/products/:path*", destination: `${backend}/products/:path*` },
      ],
    };
  },
};

export default withPWAConfigured(nextConfig);
