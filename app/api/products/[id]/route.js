import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { parseStringArray } from "@/lib/json";
import { requireSessionRoles } from "@/lib/api-auth";
import { productCreateBodySchema, productUpdateBodySchema } from "@/lib/validators/product";
import { fireBackInStockAlerts } from "@/lib/stock-alerts";
import { syncProductVariants, sumVariantStock } from "@/lib/product-variants";
import { normalizeMediaFields } from "@/lib/upload-url";

export const dynamic = "force-dynamic";

/**
 * @param {import("@prisma/client").Product} data
 */
function serializeProductResponse(data) {
  return {
    ...data,
    images: parseStringArray(data.images),
  };
}

async function resolveProduct(key) {
  return prisma.product.findFirst({
    where: { OR: [{ id: key }, { slug: key }] },
    include: {
      seller: { select: { id: true, shopName: true, shopSlug: true } },
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
    },
  });
}

export async function GET(_request, { params }) {
  try {
    const key = params.id;
    if (!key) return jsonError("Missing id", [], 400);

    const product = await resolveProduct(key);
    if (!product) return jsonError("Not found", [], 404);

    return jsonSuccess(serializeProductResponse(product));
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const gate = await requireSessionRoles(["admin", "seller"]);
    if (!gate.ok) return gate.response;

    const key = params.id;
    if (!key) return jsonError("Missing id", [], 400);

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
      select: { id: true, sellerId: true, slug: true, stockQuantity: true },
    });
    if (!existing) return jsonError("Not found", [], 404);

    if (gate.role === "seller" && existing.sellerId !== gate.session.user.id) {
      return jsonError("Forbidden", [], 403);
    }

    const body = await request.json();
    const parsed = productUpdateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const data = parsed.data;
    const media = normalizeMediaFields({ thumbnail: data.thumbnail, images: data.images });
    if (media.thumbnail !== undefined) data.thumbnail = media.thumbnail;
    if (media.images !== undefined) data.images = media.images;
    const { variants, ...productData } = data;

    if (productData.slug !== undefined && productData.slug !== existing.slug) {
      const dup = await prisma.product.findUnique({
        where: { slug: productData.slug },
        select: { id: true },
      });
      if (dup && dup.id !== existing.id) {
        return jsonError("Slug already in use", [], 409);
      }
    }

    if (productData.categoryId !== undefined && productData.categoryId !== null) {
      const c = await prisma.category.findUnique({
        where: { id: productData.categoryId },
        select: { id: true },
      });
      if (!c) return jsonError("Invalid category", [], 422);
    }
    if (productData.brandId !== undefined && productData.brandId !== null) {
      const b = await prisma.brand.findUnique({ where: { id: productData.brandId }, select: { id: true } });
      if (!b) return jsonError("Invalid brand", [], 422);
    }

    if (gate.role === "admin" && productData.sellerId !== undefined && productData.sellerId !== null) {
      const s = await prisma.seller.findUnique({ where: { id: productData.sellerId }, select: { id: true } });
      if (!s) return jsonError("Invalid seller", [], 422);
    }

    const patch = {};
    const keys = [
      "name",
      "slug",
      "sku",
      "shortDescription",
      "description",
      "categoryId",
      "brandId",
      "type",
      "price",
      "comparePrice",
      "costPrice",
      "thumbnail",
      "videoUrl",
      "stockQuantity",
      "lowStockThreshold",
      "minPurchaseQty",
      "maxPurchaseQty",
      "isActive",
      "isFeatured",
      "condition",
      "shippingType",
      "shippingCost",
      "cashOnDelivery",
      "deliveryAvailable",
      "codLocationType",
      "metaTitle",
      "metaDescription",
      "metaKeywords",
    ];
    for (const k of keys) {
      if (productData[k] !== undefined) patch[k] = productData[k];
    }
    if (productData.images !== undefined) {
      patch.images = JSON.stringify(productData.images ?? []);
    }
    if (gate.role === "admin" && productData.sellerId !== undefined) {
      patch.sellerId = productData.sellerId;
    }

    if (variants !== undefined) {
      const productType = productData.type ?? (await prisma.product.findUnique({
        where: { id: existing.id },
        select: { type: true },
      }))?.type;
      if (productType === "variable") {
        patch.stockQuantity = sumVariantStock(variants);
      }
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: patch,
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
      await syncProductVariants(prisma, existing.id, variants);
    }

    if (existing.stockQuantity <= 0 && updated.stockQuantity > 0 && updated.isActive) {
      fireBackInStockAlerts(updated.id).catch((err) => console.error("[stock-alert]", err));
    }

    return jsonSuccess(serializeProductResponse(updated));
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const gate = await requireSessionRoles(["admin", "seller"]);
    if (!gate.ok) return gate.response;

    const key = params.id;
    if (!key) return jsonError("Missing id", [], 400);

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
      select: { id: true, sellerId: true },
    });
    if (!existing) return jsonError("Not found", [], 404);

    if (gate.role === "seller" && existing.sellerId !== gate.session.user.id) {
      return jsonError("Forbidden", [], 403);
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: { isActive: false },
      select: { id: true },
    });

    return jsonSuccess({ id: existing.id, deactivated: true });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
