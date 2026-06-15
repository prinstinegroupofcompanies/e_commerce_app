import fs from "fs";
import path from "path";

/**
 * @param {Buffer} file
 * @param {string} filename
 * @returns {{ url: string }}
 */
export async function saveUpload(file, filename) {
  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver !== "local") {
    throw new Error("S3/R2 storage not wired yet — set STORAGE_DRIVER=local");
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = path.join(dir, `${Date.now()}-${safe}`);
  fs.writeFileSync(dest, file);
  const rel = dest.split("public").pop()?.replace(/\\/g, "/") || "";
  return { url: rel };
}
