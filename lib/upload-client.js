/**
 * Upload images to persistent storage (Vercel proxies to Render in production).
 *
 * @param {File} file
 * @param {string} [folder]
 */
export async function uploadImageFile(file, folder = "uploads") {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  let res = await fetch("/api/upload", {
    method: "POST",
    body,
    credentials: "include",
  });

  // Large files or proxy errors — upload directly to Render with a token.
  if (!res.ok && (res.status === 413 || res.status === 502 || res.status >= 500)) {
    const tokenRes = await fetch("/api/upload/token", { credentials: "include" });
    const tokenJson = await tokenRes.json();
    const endpoint = tokenJson.data?.endpoint;
    if (tokenRes.ok && tokenJson.success && endpoint?.startsWith("http")) {
      const headers = {};
      if (tokenJson.data.token) headers["X-Upload-Token"] = tokenJson.data.token;
      res = await fetch(endpoint, { method: "POST", headers, body });
    }
  }

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
