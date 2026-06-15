import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") || "";
  const detail = searchParams.get("detail") === "1";
  const ids = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 30);

  if (ids.length === 0) return jsonSuccess({ products: [] });

  const products = await prisma.product.findMany({
    where: {
      id: { in: ids },
      ...catalogProductVisibilityWhere(),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      thumbnail: true,
      price: true,
      comparePrice: true,
      ...(detail
        ? {
            shortDescription: true,
            stockQuantity: true,
            averageRating: true,
            totalReviews: true,
            totalSold: true,
            condition: true,
            shippingType: true,
            cashOnDelivery: true,
            brand: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            seller: { select: { shopName: true, shopSlug: true } },
          }
        : {}),
    },
  });

  const indexed = new Map(products.map((p) => [p.id, p]));
  const ordered = ids.map((id) => indexed.get(id)).filter(Boolean);
  return jsonSuccess({ products: ordered });
}
