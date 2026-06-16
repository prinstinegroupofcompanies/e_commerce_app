/**
 * Normalize legacy broken paths (uploadsavatars → uploads/avatars).
 * @param {string | null | undefined} url
 */
export function normalizeLegacyUploadPath(url) {
  if (!url || typeof url !== "string") return url;
  let path = url.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  return path.replace(/^\/uploads([a-z]+)\//i, "/uploads/$1/");
}

function uploadBaseUrl() {
  const base =
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    process.env.UPLOAD_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_RENDER_BACKEND_URL ||
    process.env.RENDER_BACKEND_URL ||
    "";
  return base.replace(/\/$/, "");
}

/**
 * Resolve a stored upload path to a browser-loadable URL (production-aware).
 * @param {string | null | undefined} url
 */
export function resolveMediaUrl(url) {
  const normalized = normalizeLegacyUploadPath(url);
  if (!normalized) return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;
  const base = uploadBaseUrl();
  if (base && (normalized.startsWith("/uploads") || normalized.includes("/uploads/"))) {
    return `${base}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
  }
  return normalized;
}

/**
 * Public URL returned after upload (relative in dev, absolute when backend base is set).
 * @param {string} relativePath e.g. /uploads/avatars/file.png
 */
export function publicUploadUrl(relativePath) {
  const path = normalizeLegacyUploadPath(relativePath);
  const base = uploadBaseUrl();
  if (base) return `${base}${path}`;
  return path;
}
