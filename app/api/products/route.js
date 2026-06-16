import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { parseStringArray } from "@/lib/json";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";
import { requireSessionRoles } from "@/lib/api-auth";
import { productCreateBodySchema } from "@/lib/validators/product";
import { syncProductVariants, sumVariantStock } from "@/lib/product-variants";
import { normalizeMediaFields } from "@/lib/upload-url";

export const dynamic = "force-dynamic";

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  featured: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
});

/**
 * @param {import("@prisma/client").Product} data
 */
function serializeProductResponse(data) {
  return {
    ...data,
    images: parseStringArray(data.images),
  };
}

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["admin", "seller"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = productCreateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const data = { ...parsed.data };
    const media = normalizeMediaFields({ thumbnail: data.thumbnail, images: data.images });
    if (media.thumbnail !== undefined) data.thumbnail = media.thumbnail;
    if (media.images !== undefined) data.images = media.images;

    if (gate.role === "seller") {
      data.sellerId = gate.session.user.id;
    } else if (!data.sellerId) {
      return jsonError("Seller is required", [], 422);
    }

    const dupSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (dupSlug) return jsonError("Slug already in use", [], 409);

    if (data.categoryId) {
      const c = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
      if (!c) return jsonError("Invalid category", [], 422);
    }
    if (data.brandId) {
      const b = await prisma.brand.findUnique({ where: { id: data.brandId }, select: { id: true } });
      if (!b) return jsonError("Invalid brand", [], 422);
    }
    if (data.sellerId) {
      const s = await prisma.seller.findUnique({ where: { id: data.sellerId }, select: { id: true } });
      if (!s) return jsonError("Invalid seller", [], 422);
    }

    const imagesJson = JSON.stringify(data.images ?? []);
    const { variants, ...productData } = data;
    const stockQuantity =
      productData.type === "variable" && variants?.length
        ? sumVariantStock(variants)
        : productData.stockQuantity;

    try {
      const created = await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          sku: productData.sku ?? null,
          shortDescription: productData.shortDescription ?? null,
          description: productData.description ?? null,
          categoryId: productData.categoryId ?? null,
          brandId: productData.brandId ?? null,
          sellerId: productData.sellerId ?? null,
          type: productData.type,
          price: productData.price,
          comparePrice: productData.comparePrice ?? null,
          costPrice: productData.costPrice ?? null,
          thumbnail: productData.thumbnail ?? null,
          images: imagesJson,
          videoUrl: productData.videoUrl ?? null,
          stockQuantity,
          lowStockThreshold: productData.lowStockThreshold,
          minPurchaseQty: productData.minPurchaseQty,
          maxPurchaseQty: productData.maxPurchaseQty ?? null,
          isActive: productData.isActive,
          isFeatured: productData.isFeatured,
          condition: productData.condition,
          shippingType: productData.shippingType,
          shippingCost: productData.shippingCost ?? null,
          cashOnDelivery: productData.cashOnDelivery,
          deliveryAvailable: productData.deliveryAvailable,
          codLocationType: productData.codLocationType,
          metaTitle: productData.metaTitle ?? null,
          metaDescription: productData.metaDescription ?? null,
          metaKeywords: productData.metaKeywords ?? null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stockQuantity: true,
          isActive: true,
          sellerId: true,
          images: true,
        },
      });

      if (variants !== undefined) {
        await syncProductVariants(prisma, created.id, variants);
      }

      return jsonSuccess(serializeProductResponse(created), {}, 201);
    } catch (e) {
      if (e?.code === "P2002") {
        return jsonError("Duplicate slug or SKU", [], 409);
      }
      throw e;
    }
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listQuery.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const { page, perPage, featured, search } = parsed.data;
    const where = {
      AND: [
        catalogProductVisibilityWhere(),
        ...(featured === "true" ? [{ isFeatured: true }] : []),
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search } },
                  { shortDescription: { contains: search } },
                  { slug: { contains: search } },
                ],
              },
            ]
          : []),
      ],
    };

    const [total, rows] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          thumbnail: true,
          images: true,
          averageRating: true,
          totalReviews: true,
          sellerId: true,
          seller: { select: { shopName: true, shopSlug: true } },
        },
      }),
    ]);

    const data = rows.map((p) => ({
      ...p,
      images: parseStringArray(p.images),
    }));

    return jsonSuccess(data, { total, page, perPage });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
