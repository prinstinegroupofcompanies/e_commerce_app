import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { verifyUploadToken, createUploadToken } from "@/lib/upload-auth";
import { uploadCorsHeaders } from "@/lib/upload-cors";
import { saveUploadedImage } from "@/lib/upload-storage";
import { toStoredUploadPath } from "@/lib/upload-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function renderBackend() {
  return process.env.RENDER_BACKEND_URL?.replace(/\/$/, "") || null;
}

/**
 * @param {Response} response
 * @param {Record<string, string>} headers
 */
function withHeaders(response, headers) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

async function authorizeUpload(request) {
  const token = request.headers.get("x-upload-token");
  if (token) {
    const claims = verifyUploadToken(token);
    if (!claims) return { ok: false, response: jsonError("Invalid or expired upload token", [], 401) };
    return { ok: true, claims };
  }
  return requireSessionRoles(["customer", "seller", "admin"]);
}

/**
 * Forward upload to Render so files land on persistent disk (Vercel filesystem is ephemeral).
 * @param {import("@/lib/api-auth").SessionGate & { ok: true }} gate
 * @param {FormData} form
 */
async function proxyUploadToRender(gate, form) {
  const backend = renderBackend();
  if (!backend) return null;

  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads");
  if (!file || typeof file === "string") return null;

  const userId = gate.claims?.userId || gate.session?.user?.id;
  const role = gate.claims?.role || gate.role;
  if (!userId || !role) return null;

  const token = createUploadToken(userId, role);
  const forward = new FormData();
  forward.append("file", file);
  forward.append("folder", folder);

  const upstream = await fetch(`${backend}/api/upload`, {
    method: "POST",
    headers: { "X-Upload-Token": token },
    body: forward,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function OPTIONS(request) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: uploadCorsHeaders(origin) });
}

export async function POST(request) {
  const cors = uploadCorsHeaders(request.headers.get("origin"));

  const gate = await authorizeUpload(request);
  if (!gate.ok) return withHeaders(gate.response, cors);

  let form;
  try {
    form = await request.formData();
  } catch {
    return withHeaders(jsonError("Invalid form-data", [], 400), cors);
  }

  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads");

  if (!file || typeof file === "string") return withHeaders(jsonError("No file provided", [], 422), cors);

  // Vercel: never write uploads locally — proxy to Render persistent storage.
  if (renderBackend() && !request.headers.get("x-upload-token")) {
    try {
      const proxied = await proxyUploadToRender(gate, form);
      if (proxied) return withHeaders(proxied, cors);
    } catch (err) {
      console.error("[upload proxy]", err);
      return withHeaders(jsonError("Upload server unavailable", [], 502), cors);
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedImage({
      buffer,
      mime: file.type,
      originalName: file.name || "",
      folder,
    });
    const storedPath = toStoredUploadPath(saved.relativePath);
    return withHeaders(
      jsonSuccess({
        path: storedPath,
        url: storedPath,
        size: saved.size,
        type: saved.type,
      }),
      cors
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    if (message.includes("Unsupported")) return withHeaders(jsonError(message, [], 415), cors);
    if (message.includes("too large")) return withHeaders(jsonError(message, [], 413), cors);
    console.error("[upload]", err);
    return withHeaders(jsonError("Upload failed", [], 500), cors);
  }
}
