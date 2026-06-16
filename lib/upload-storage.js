import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { publicUploadUrl } from "@/lib/upload-url";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

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
    default:
      return fallback || ".bin";
  }
}

/**
 * @param {{ buffer: Buffer; mime: string; originalName?: string; folder?: string }} input
 */
export async function saveUploadedImage({ buffer, mime, originalName = "", folder = "uploads" }) {
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Unsupported file type");
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("File too large (max 4MB)");
  }

  const safeFolder = sanitizeUploadFolder(folder);
  const ext = extFromMime(mime, path.extname(originalName || ""));
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const root = path.join(process.cwd(), "public", safeFolder);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path.join(root, filename), buffer);

  const relativePath = `/${safeFolder}/${filename}`;
  return {
    relativePath,
    url: publicUploadUrl(relativePath),
    size: buffer.length,
    type: mime,
  };
}
