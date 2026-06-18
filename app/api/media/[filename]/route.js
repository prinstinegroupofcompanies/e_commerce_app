import path from "node:path";
import fs from "node:fs/promises";
import { findUploadedFile, getPublicRoot, mimeFromExtension } from "@/lib/upload-storage";
import { isBareUploadFilename, normalizeLegacyUploadPath } from "@/lib/upload-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * @param {string} filename
 */
function renderBackend() {
  return (
    process.env.RENDER_BACKEND_URL ||
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    process.env.NEXT_PUBLIC_RENDER_BACKEND_URL ||
    ""
  ).replace(/\/$/, "");
}

/**
 * @param {string} backend
 * @param {string} filename
 */
function upstreamCandidates(backend, filename) {
  const encoded = encodeURIComponent(filename);
  return [
    `${backend}/api/media/${encoded}`,
    `${backend}/uploads/banners/${filename}`,
    `${backend}/uploads/products/${filename}`,
    `${backend}/uploads/shops/${filename}`,
    `${backend}/uploads/avatars/${filename}`,
    `${backend}/uploads/blog/${filename}`,
    `${backend}/uploads/${filename}`,
    `${backend}/products/${filename}`,
  ];
}

/**
 * @param {string} url
 */
async function fetchUpstream(url) {
  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) return null;
  return upstream;
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
  if (relative) {
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

  const backend = renderBackend();
  if (backend) {
    for (const url of upstreamCandidates(backend, filename)) {
      try {
        const upstream = await fetchUpstream(url);
        if (upstream) {
          return new Response(upstream.body, {
            status: upstream.status,
            headers: {
              "Content-Type": upstream.headers.get("Content-Type") || mimeFromExtension(path.extname(filename)),
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch {
        /* try next candidate */
      }
    }
  }

  return new Response("Not found", { status: 404 });
}
