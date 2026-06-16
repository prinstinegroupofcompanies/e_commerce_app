/**
 * @param {string | null} origin
 */
export function uploadCorsHeaders(origin) {
  if (!origin) return {};

  const normalized = origin.replace(/\/$/, "");
  const allowed = new Set(
    [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL]
      .filter(Boolean)
      .map((url) => String(url).replace(/\/$/, ""))
  );

  let isAllowed = allowed.has(normalized);
  if (!isAllowed) {
    try {
      const host = new URL(origin).hostname;
      isAllowed = host.endsWith(".vercel.app");
    } catch {
      isAllowed = false;
    }
  }

  if (!isAllowed) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Upload-Token",
    "Access-Control-Max-Age": "86400",
  };
}
