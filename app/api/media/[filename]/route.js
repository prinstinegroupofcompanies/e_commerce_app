import path from "node:path";
import fs from "node:fs/promises";
import { findUploadedFile, getPublicRoot, mimeFromExtension } from "@/lib/upload-storage";
import { isBareUploadFilename, normalizeLegacyUploadPath } from "@/lib/upload-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * @param {string} filename
 */
function renderMediaUrl(filename) {
  const backend = (
    process.env.RENDER_BACKEND_URL ||
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    process.env.NEXT_PUBLIC_RENDER_BACKEND_URL ||
    ""
  ).replace(/\/$/, "");
  if (!backend) return null;
  return `${backend}/api/media/${encodeURIComponent(filename)}`;
}

/**
 * Serve or proxy uploaded images when only the bare filename is known (legacy DB rows).
 */
export async function GET(_request, { params }) {
  const filename = decodeURIComponent(params.filename || "");
  if (!isBareUploadFilename(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const relative = await findUploadedFile(filename);
  if (!relative) {
    const remote = renderMediaUrl(filename);
    if (remote) {
      try {
        const upstream = await fetch(remote, { cache: "no-store" });
        if (upstream.ok) {
          return new Response(upstream.body, {
            status: upstream.status,
            headers: {
              "Content-Type": upstream.headers.get("Content-Type") || mimeFromExtension(path.extname(filename)),
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch {
        /* fall through */
      }
    }
    return new Response("Not found", { status: 404 });
  }

  const absolute = path.join(getPublicRoot(), relative);
  const buffer = await fs.readFile(absolute);
  return new Response(buffer, {
    headers: {
      "Content-Type": mimeFromExtension(path.extname(filename)),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Media-Path": normalizeLegacyUploadPath(relative),
    },
  });
}
