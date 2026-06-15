import { formatVariantOptions } from "@/lib/variant-options";

/**
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string} productId
 * @param {import("@/lib/validators/product").productVariantInputSchema._type[]} variants
 */
export async function syncProductVariants(prisma, productId, variants) {
  if (variants === undefined) return;

  await prisma.productVariant.deleteMany({ where: { productId } });

  if (!variants?.length) return;

  await prisma.productVariant.createMany({
    data: variants.map((v) => ({
      productId,
      options:
        typeof v.options === "string" && v.options.trim()
          ? v.options.trim()
          : formatVariantOptions(
              typeof v.options === "object" && v.options ? v.options : {}
            ),
      sku: v.sku ?? null,
      price: v.price,
      comparePrice: v.comparePrice ?? null,
      stock: v.stock ?? 0,
      image: v.image ?? null,
      isActive: v.isActive !== false,
    })),
  });
}

/**
 * @param {import("@/lib/validators/product").productVariantInputSchema._type[]} variants
 */
export function sumVariantStock(variants) {
  if (!variants?.length) return 0;
  return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
}
