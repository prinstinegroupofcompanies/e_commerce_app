import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { createUploadToken } from "@/lib/upload-auth";
import { uploadCorsHeaders } from "@/lib/upload-cors";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function uploadEndpoint() {
  const backend =
    process.env.RENDER_BACKEND_URL ||
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    process.env.NEXT_PUBLIC_RENDER_BACKEND_URL ||
    "";
  if (backend) return `${backend.replace(/\/$/, "")}/api/upload`;
  return "/api/upload";
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

export async function OPTIONS(request) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: uploadCorsHeaders(origin) });
}

/** Issue a short-lived token so the browser can upload directly to Render (avoids Vercel 502 / body limits). */
export async function GET(request) {
  const cors = uploadCorsHeaders(request.headers.get("origin"));

  const gate = await requireSessionRoles(["customer", "seller", "admin"]);
  if (!gate.ok) return withHeaders(gate.response, cors);

  try {
    const token = createUploadToken(gate.session.user.id, gate.role);
    return withHeaders(
      jsonSuccess({
        endpoint: uploadEndpoint(),
        token,
        maxBytes: MAX_UPLOAD_BYTES,
        useDirectUpload: Boolean(process.env.RENDER_BACKEND_URL),
      }),
      cors
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload token unavailable";
    return withHeaders(jsonError(message, [], 503), cors);
  }
}
