import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

/** 15 MB — large product photos; direct Render upload avoids Vercel body limits. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * @param {string} raw
 */
export function sanitizeUploadFolder(raw) {
  const parts = String(raw || "uploads")
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9_-]/gi, "").toLowerCase())
    .filter(Boolean);
  if (!parts.length || parts[0] !== "uploads") {
    return ["uploads", ...parts.filter((p) => p !== "uploads")].join("/");
  }
  return parts.join("/");
}

/**
 * Root directory for browser-served files (public/).
 */
export function getPublicRoot() {
  const configured = process.env.UPLOAD_PUBLIC_ROOT?.trim();
  if (configured) return path.resolve(configured);
  return path.join(process.cwd(), "public");
}

/**
 * @param {Buffer} buffer
 * @param {string} [declaredMime]
 * @param {string} [originalName]
 */
export function detectImageMime(buffer, declaredMime = "", originalName = "") {
  const declared = String(declaredMime || "").toLowerCase();
  if (ALLOWED_MIME.has(declared)) return declared === "image/jpg" ? "image/jpeg" : declared;

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 6) === "GIF87a") return "image/gif";
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 6) === "GIF89a") return "image/gif";
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";

  const ext = path.extname(originalName || "").toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  if (ext === ".heic" || ext === ".heif") return "image/heic";

  return null;
}

function extFromMime(mime, fallback) {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    case "image/heic":
    case "image/heif":
      return ".heic";
    default:
      return fallback || ".bin";
  }
}

/**
 * @param {{ buffer: Buffer; mime: string; originalName?: string; folder?: string }} input
 */
export async function saveUploadedImage({ buffer, mime, originalName = "", folder = "uploads" }) {
  const detected = detectImageMime(buffer, mime, originalName);
  if (!detected) {
    throw new Error("Unsupported file type — use PNG, JPG, WEBP, GIF, AVIF, or HEIC");
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large (max ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB)`);
  }

  const safeFolder = sanitizeUploadFolder(folder);
  const ext = extFromMime(detected, path.extname(originalName || ""));
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const root = path.join(getPublicRoot(), safeFolder);
  await fs.mkdir(root, { recursive: true });
  const absolutePath = path.join(root, filename);
  await fs.writeFile(absolutePath, buffer);

  const relativePath = `/${safeFolder}/${filename}`.replace(/\/+/g, "/");
  return {
    relativePath,
    size: buffer.length,
    type: detected,
  };
}
