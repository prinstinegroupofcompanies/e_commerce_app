/**
 * Upload images via token-backed direct Render upload in production (avoids Vercel 502 / 4.5MB limit).
 *
 * @param {File} file
 * @param {string} [folder]
 */
export async function uploadImageFile(file, folder = "uploads") {
  const tokenRes = await fetch("/api/upload/token", { credentials: "include" });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.success) {
    throw new Error(tokenJson.error || "Could not start upload");
  }

  const { endpoint, token, maxBytes } = tokenJson.data || {};
  if (!endpoint) throw new Error("Upload endpoint unavailable");
  if (file.size > maxBytes) {
    throw new Error(`File too large (max ${Math.round(maxBytes / (1024 * 1024))}MB)`);
  }

  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  const headers = {};
  if (token) headers["X-Upload-Token"] = token;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body,
    credentials: endpoint.startsWith("/") ? "include" : "omit",
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(res.status === 502 ? "Upload server unavailable — try again in a moment" : "Upload failed");
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Upload failed (${res.status})`);
  }

  return json.data?.path || json.data?.url || null;
}
