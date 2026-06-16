import { jsonError, jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { saveUploadedImage } from "@/lib/upload-storage";

export const dynamic = "force-dynamic";

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
  const folder = String(form.get("folder") || "uploads");

  if (!file || typeof file === "string") return jsonError("No file provided", [], 422);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedImage({
      buffer,
      mime: file.type,
      originalName: file.name || "",
      folder,
    });
    return jsonSuccess({
      url: saved.url,
      path: saved.relativePath,
      size: saved.size,
      type: saved.type,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    if (message.includes("Unsupported")) return jsonError(message, [], 415);
    if (message.includes("too large")) return jsonError(message, [], 413);
    console.error("[upload]", err);
    return jsonError("Upload failed", [], 500);
  }
}
