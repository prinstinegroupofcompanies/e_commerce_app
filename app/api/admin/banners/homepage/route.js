import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { HOMEPAGE_BANNER_SLOTS } from "@/lib/homepage-banners";
import { toStoredUploadPath } from "@/lib/upload-url";

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

export async function PATCH(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  }

  const updated = await prisma.$transaction(
    parsed.data.banners.map((slot, index) =>
      prisma.banner.update({
        where: { id: slot.id },
        data: {
          title: slot.title.trim(),
          image: toStoredUploadPath(slot.image) || slot.image,
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
