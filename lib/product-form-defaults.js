import { parseStringArray } from "@/lib/json";
import { parseVariantOptions } from "@/lib/variant-options";

export function emptyVariantRow() {
  return {
    size: "",
    color: "",
    price: "",
    stock: "0",
    sku: "",
  };
}

/**
 * @param {import("@prisma/client").Product & { images?: string | null }} [product]
 * @param {{ options: string; price: number; stock: number; sku?: string | null }[]} [variants]
 */
export function defaultProductFormValues(product, variants = []) {
  if (!product) {
    return {
      name: "",
      slug: "",
      sku: "",
      shortDescription: "",
      description: "",
      categoryId: "",
      brandId: "",
      sellerId: "",
      type: "simple",
      price: "0",
      comparePrice: "",
      costPrice: "",
      thumbnail: "",
      imageUrls: [],
      videoUrl: "",
      stockQuantity: "0",
      lowStockThreshold: "5",
      minPurchaseQty: "1",
      maxPurchaseQty: "",
      isActive: true,
      isFeatured: false,
      condition: "new",
      shippingType: "flat",
      shippingCost: "",
      cashOnDelivery: true,
      deliveryAvailable: true,
      codLocationType: "everywhere",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      variantsRows: [emptyVariantRow()],
    };
  }

  const images = parseStringArray(product.images);
  const gallery = [...new Set([product.thumbnail, ...images].filter(Boolean))];

  const variantsRows =
    variants.length > 0
      ? variants.map((v) => {
          const opts = parseVariantOptions(v.options);
          return {
            size: opts.Size || opts.size || "",
            color: opts.Color || opts.color || "",
            price: String(v.price ?? product.price ?? 0),
            stock: String(v.stock ?? 0),
            sku: v.sku ?? "",
          };
        })
      : product.type === "variable"
        ? [emptyVariantRow()]
        : [];

  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    categoryId: product.categoryId ?? "",
    brandId: product.brandId ?? "",
    sellerId: product.sellerId ?? "",
    type: product.type === "variable" ? "variable" : "simple",
    price: String(product.price ?? 0),
    comparePrice: product.comparePrice != null ? String(product.comparePrice) : "",
    costPrice: product.costPrice != null ? String(product.costPrice) : "",
    thumbnail: product.thumbnail ?? "",
    imageUrls: gallery,
    videoUrl: product.videoUrl ?? "",
    stockQuantity: String(product.stockQuantity ?? 0),
    lowStockThreshold: String(product.lowStockThreshold ?? 5),
    minPurchaseQty: String(product.minPurchaseQty ?? 1),
    maxPurchaseQty: product.maxPurchaseQty != null ? String(product.maxPurchaseQty) : "",
    isActive: product.isActive !== false,
    isFeatured: Boolean(product.isFeatured),
    condition: product.condition === "used" || product.condition === "refurbished" ? product.condition : "new",
    shippingType:
      product.shippingType === "profile" || product.shippingType === "free" ? product.shippingType : "flat",
    shippingCost: product.shippingCost != null ? String(product.shippingCost) : "",
    cashOnDelivery: product.cashOnDelivery !== false,
    deliveryAvailable: product.deliveryAvailable !== false,
    codLocationType: product.codLocationType === "custom" ? "custom" : "everywhere",
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
    metaKeywords: product.metaKeywords ?? "",
    variantsRows,
  };
}
