import { prisma } from "@/lib/prisma";

/** Active paid/sponsored placements for storefront */
export async function getActiveStoreAdvertisements() {
  const now = new Date();
  return prisma.storeAdvertisement.findMany({
    where: {
      status: "active",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      image: true,
      link: true,
      placement: true,
      seller: { select: { shopName: true, shopSlug: true } },
    },
  });
}
