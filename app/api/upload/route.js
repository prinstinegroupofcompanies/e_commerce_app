import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 4 * 1024 * 1024;

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

export async function POST(request) {
  const gate = await requireSessionRoles(["customer", "seller", "admin"]);
  if (!gate.ok) return gate.response;

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Invalid form-data", [], 400);
  }

  const file = form.get("file");
  const folderRaw = String(form.get("folder") || "uploads").replace(/[^a-z0-9-]/gi, "");
  const folder = folderRaw || "uploads";

  if (!file || typeof file === "string") return jsonError("No file provided", [], 422);
  if (!ALLOWED_MIME.has(file.type)) return jsonError("Unsupported file type", [], 415);
  if (file.size > MAX_BYTES) return jsonError("File too large (max 4MB)", [], 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(file.type, path.extname(file.name || ""));
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  const root = path.join(process.cwd(), "public", folder);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path.join(root, filename), buffer);

  const url = `/${folder}/${filename}`;
  return jsonSuccess({ url, size: file.size, type: file.type });
}
