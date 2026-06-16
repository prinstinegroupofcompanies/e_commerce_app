import crypto from "node:crypto";

const ALLOWED_UPLOAD_ROLES = new Set(["customer", "seller", "admin"]);

function uploadSecret() {
  return process.env.UPLOAD_INTERNAL_SECRET || process.env.CRON_SECRET || "";
}

/**
 * @param {string} userId
 * @param {string} role
 */
export function createUploadToken(userId, role) {
  const secret = uploadSecret();
  if (!secret) throw new Error("UPLOAD_INTERNAL_SECRET is not configured");
  if (!ALLOWED_UPLOAD_ROLES.has(role)) throw new Error("Invalid upload role");

  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${userId}:${role}:${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

/**
 * @param {string | null | undefined} token
 */
export function verifyUploadToken(token) {
  if (!token) return null;
  const secret = uploadSecret();
  if (!secret) return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [userId, role, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!userId || !role || !Number.isFinite(exp) || Date.now() > exp) return null;
    if (!ALLOWED_UPLOAD_ROLES.has(role)) return null;

    const payload = `${userId}:${role}:${exp}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (sig !== expected) return null;
    return { userId, role };
  } catch {
    return null;
  }
}
