/**
 * @param {string | null} origin
 */
export function uploadCorsHeaders(origin) {
  const allowed = new Set(
    [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL]
      .filter(Boolean)
      .map((url) => String(url).replace(/\/$/, ""))
  );

  const normalized = origin?.replace(/\/$/, "");
  if (!normalized || !allowed.has(normalized)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Upload-Token",
    "Access-Control-Max-Age": "86400",
  };
}
