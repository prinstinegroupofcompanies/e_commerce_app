import { prisma } from "@/lib/prisma";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";

/**
 * @param {Awaited<ReturnType<import("./interactions").getInteractionInsights>>} insights
 * @param {number} take
 */
export async function getPersonalizedProducts(insights, take = 6) {
  const visible = catalogProductVisibilityWhere();
  const exclude = new Set(insights.recentProductIds);

  if (insights.topProductIds.length) {
    const similar = await prisma.product.findMany({
      where: {
        AND: [
          visible,
          { id: { notIn: [...exclude] } },
          {
            OR: [
              { categoryId: { in: insights.topCategoryIds.filter(Boolean) } },
              { sellerId: { in: insights.topSellerIds.filter(Boolean) } },
            ],
          },
        ],
      },
      orderBy: [{ totalSold: "desc" }, { averageRating: "desc" }],
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        thumbnail: true,
        seller: { select: { shopName: true, shopSlug: true } },
      },
    });
    if (similar.length >= 3) return similar;
  }

  const trending = await prisma.product.findMany({
    where: {
      AND: [visible, { id: { notIn: [...exclude] } }],
    },
    orderBy: { totalSold: "desc" },
    take,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      thumbnail: true,
      seller: { select: { shopName: true, shopSlug: true } },
    },
  });

  return trending;
}

/**
 * @param {Awaited<ReturnType<import("./interactions").getInteractionInsights>>} insights
 */
export async function getPersonalizedSellers(insights) {
  if (!insights.topSellerIds.length) {
    return prisma.seller.findMany({
      where: { isActive: true, isShopActive: true, shopSlug: { not: null } },
      orderBy: { totalOrders: "desc" },
      take: 4,
      select: { shopName: true, shopSlug: true, shopDescription: true },
    });
  }
  return prisma.seller.findMany({
    where: { id: { in: insights.topSellerIds }, isActive: true, isShopActive: true },
    take: 4,
    select: { shopName: true, shopSlug: true, shopDescription: true },
  });
}
