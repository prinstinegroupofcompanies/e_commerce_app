import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

import { dbContains } from "@/lib/db-contains";

function contains(q) {
  return dbContains(q);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const { q, limit } = parsed.data;

    const [products, stores] = await Promise.all([
      prisma.product.findMany({
        where: {
          AND: [
            catalogProductVisibilityWhere(),
            {
              OR: [
                { name: contains(q) },
                { shortDescription: contains(q) },
                { slug: contains(q) },
                { brand: { isActive: true, name: contains(q) } },
                { category: { isActive: true, name: contains(q) } },
              ],
            },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          thumbnail: true,
          seller: { select: { shopName: true, shopSlug: true } },
        },
      }),
      prisma.seller.findMany({
        where: {
          verificationStatus: "approved",
          isShopActive: true,
          isActive: true,
          OR: [
            { shopName: contains(q) },
            { shopDescription: contains(q) },
            { shopCity: contains(q) },
            { shopCounty: contains(q) },
            { businessCategory: contains(q) },
            { name: contains(q) },
          ],
        },
        take: limit,
        orderBy: { totalOrders: "desc" },
        select: {
          id: true,
          shopName: true,
          shopSlug: true,
          shopLogo: true,
          shopCity: true,
          shopCounty: true,
          businessCategory: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      }),
    ]);

    return jsonSuccess({ products, stores, q });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
