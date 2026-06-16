import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { HOMEPAGE_BANNER_SLOTS } from "@/lib/homepage-banners";
import { repairUnsplashPath, toStoredUploadPath } from "@/lib/upload-url";

export const dynamic = "force-dynamic";

const slotSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  image: z.string().min(1).max(2000),
  link: z.string().max(2000).optional().nullable(),
  isActive: z.boolean(),
});

const bodySchema = z.object({
  banners: z.array(slotSchema).length(HOMEPAGE_BANNER_SLOTS),
});

/**
 * @param {string} image
 */
function storeBannerImage(image) {
  const trimmed = (image || "").trim() || "/placeholder-banner.svg";
  const repaired = repairUnsplashPath(trimmed);
  if (repaired.startsWith("http://") || repaired.startsWith("https://")) {
    return toStoredUploadPath(repaired) || repaired;
  }
  return toStoredUploadPath(trimmed) || trimmed;
}

/**
 * @param {unknown[]} raw
 */
function normalizeBannerPayload(raw) {
  return raw.map((slot, index) => {
    const row = /** @type {Record<string, unknown>} */ (slot || {});
    return {
      id: String(row.id || ""),
      title: String(row.title || "").trim() || `Hero banner ${index + 1}`,
      image: String(row.image || "").trim() || "/placeholder-banner.svg",
      link: row.link == null || row.link === "" ? null : String(row.link).trim(),
      isActive: Boolean(row.isActive),
    };
  });
}

export async function PATCH(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const rawBanners = Array.isArray(body.banners) ? body.banners : [];
  if (rawBanners.length !== HOMEPAGE_BANNER_SLOTS) {
    return jsonError(
      `Send exactly ${HOMEPAGE_BANNER_SLOTS} homepage banners`,
      { banners: [`Expected ${HOMEPAGE_BANNER_SLOTS} items, got ${rawBanners.length}`] },
      422
    );
  }

  const normalized = normalizeBannerPayload(rawBanners);
  const parsed = bodySchema.safeParse({ banners: normalized });
  if (!parsed.success) {
    return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const updated = await prisma.$transaction(
    parsed.data.banners.map((slot, index) =>
      prisma.banner.update({
        where: { id: slot.id },
        data: {
          title: slot.title.trim(),
          image: storeBannerImage(slot.image),
          link: slot.link?.trim() || null,
          isActive: slot.isActive,
          position: "homepage",
          sortOrder: index,
        },
      })
    )
  );

  return jsonSuccess(updated);
}
