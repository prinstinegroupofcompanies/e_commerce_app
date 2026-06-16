import { prisma } from "@/lib/prisma";
import { repairUnsplashPath } from "@/lib/upload-url";

export const HOMEPAGE_BANNER_SLOTS = 3;

/**
 * Ensure exactly three homepage hero banner slots exist (sortOrder 0–2).
 */
export async function ensureHomepageBanners() {
  const existing = await prisma.banner.findMany({
    where: { position: "homepage" },
    orderBy: { sortOrder: "asc" },
  });

  /** @type {import("@prisma/client").Banner[]} */
  const slots = [];

  for (let sortOrder = 0; sortOrder < HOMEPAGE_BANNER_SLOTS; sortOrder++) {
    let banner = existing.find((b) => b.sortOrder === sortOrder);
    if (!banner) {
      banner = await prisma.banner.create({
        data: {
          title: `Hero banner ${sortOrder + 1}`,
          image: "/placeholder-banner.svg",
          position: "homepage",
          sortOrder,
          isActive: false,
        },
      });
    } else if (banner.image?.match(/^\/?photo-/i)) {
      const repaired = repairUnsplashPath(banner.image);
      if (repaired !== banner.image) {
        banner = await prisma.banner.update({
          where: { id: banner.id },
          data: { image: repaired },
        });
      }
    }
    slots.push(banner);
  }

  return slots;
}
