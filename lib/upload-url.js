const UPLOAD_FILE_RE = /^\/?\d{13}-[a-f0-9]+\.(png|jpe?g|webp|gif|avif|heic|heif)$/i;

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
 * Normalize legacy broken paths (uploadsshops → uploads/shops).
 * @param {string | null | undefined} url
 */
export function normalizeLegacyUploadPath(url) {
  if (!url || typeof url !== "string") return url;
  let value = url.trim();
  if (!value) return value;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      value = parsed.pathname + (parsed.search || "");
    } catch {
      return value;
    }
  }

  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/^\/uploads([a-z]+)\//i, "/uploads/$1/");

  if (UPLOAD_FILE_RE.test(value)) {
    const name = value.replace(/^\//, "");
    return `/uploads/${name}`;
  }

  return value;
}

/**
 * Store a relative upload path in the database (strip absolute backend host).
 * @param {string | null | undefined} url
 */
export function toStoredUploadPath(url) {
  const normalized = normalizeLegacyUploadPath(url);
  if (!normalized) return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      return normalizeLegacyUploadPath(new URL(normalized).pathname);
    } catch {
      return normalized;
    }
  }
  return normalized;
}

/**
 * Resolve a stored upload path to a browser-loadable URL.
 * Prefers same-origin relative paths so Vercel can proxy /uploads/* to Render.
 * @param {string | null | undefined} url
 */
export function resolveMediaUrl(url) {
  const normalized = normalizeLegacyUploadPath(url);
  if (!normalized) return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;
  if (normalized.startsWith("/uploads") || normalized.startsWith("/products/")) return normalized;
  return normalized;
}

/**
 * @deprecated Use toStoredUploadPath — kept for compatibility.
 * @param {string} relativePath
 */
export function publicUploadUrl(relativePath) {
  return toStoredUploadPath(relativePath);
}
