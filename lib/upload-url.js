const UPLOAD_FILE_CAPTURE = /(\d{13}-[a-f0-9]+\.(?:png|jpe?g|webp|gif|avif|heic|heif))$/i;
const BARE_UPLOAD_FILE_RE = /^\/?\d{13}-[a-f0-9]+\.(png|jpe?g|webp|gif|avif|heic|heif)$/i;
const UNSPLASH_PATH_RE = /^\/?(photo-\d+[-\w]*)(\?.*)?$/i;

/**
 * @param {string} value
 */
export function isBareUploadFilename(value) {
  const base = String(value || "").trim().replace(/^\//, "");
  return BARE_UPLOAD_FILE_RE.test(base);
}

/**
 * Repair legacy banner URLs stored as `/photo-…` after hostname was stripped.
 * @param {string | null | undefined} url
 */
export function repairUnsplashPath(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const match = trimmed.match(UNSPLASH_PATH_RE);
  if (!match) return trimmed;
  return `https://images.unsplash.com/${match[1]}${match[2] || ""}`;
}

/**
 * @param {string} hostname
 */
function isOwnUploadHost(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  const envUrls = [
    process.env.RENDER_BACKEND_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];
  for (const raw of envUrls) {
    if (!raw) continue;
    try {
      if (new URL(raw).hostname === hostname) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/**
 * @param {string | null | undefined} url
 */
export function extractUploadFilename(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(UPLOAD_FILE_CAPTURE);
  return match ? match[1] : null;
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
    return value;
  }

  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/^\/uploads([a-z]+)\//i, "/uploads/$1/");
  return value;
}

/**
 * Store a relative upload path in the database (strip absolute backend host).
 * @param {string | null | undefined} url
 */
export function toStoredUploadPath(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (!isOwnUploadHost(parsed.hostname)) {
        return trimmed;
      }
      return normalizeLegacyUploadPath(parsed.pathname + (parsed.search || ""));
    } catch {
      return trimmed;
    }
  }

  return normalizeLegacyUploadPath(trimmed);
}

/**
 * Resolve a stored upload path to a browser-loadable URL (always root-absolute).
 * Uploaded assets are served via /api/media which reads Render persistent disk.
 * @param {string | null | undefined} url
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/placeholder") || trimmed.startsWith("data:")) return trimmed;

  const unsplash = repairUnsplashPath(trimmed);
  if (unsplash !== trimmed) return unsplash;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const filename = extractUploadFilename(trimmed);
  if (filename) {
    return `/api/media/${encodeURIComponent(filename)}`;
  }

  const normalized = normalizeLegacyUploadPath(trimmed);
  if (!normalized) return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;
  if (!normalized.startsWith("/")) return `/${normalized}`;
  return normalized;
}

/**
 * @deprecated Use toStoredUploadPath — kept for compatibility.
 * @param {string} relativePath
 */
export function publicUploadUrl(relativePath) {
  return toStoredUploadPath(relativePath);
}

/**
 * Normalize image fields before persisting to the database.
 * @param {{ thumbnail?: string | null; images?: string[] | null }} data
 */
export function normalizeMediaFields(data) {
  const thumbnail =
    data.thumbnail === undefined
      ? undefined
      : data.thumbnail
        ? toStoredUploadPath(data.thumbnail)
        : null;
  const images =
    data.images === undefined
      ? undefined
      : Array.isArray(data.images)
        ? data.images.map((u) => toStoredUploadPath(u)).filter(Boolean)
        : [];
  return { thumbnail, images };
}
