import { parseStringArray } from "@/lib/json";

/**
 * @param {{ thumbnail?: string | null; images?: string | string[] | null }} product
 */
export function getProductGalleryImages(product) {
  const parsed = Array.isArray(product.images)
    ? product.images.filter((x) => typeof x === "string")
    : parseStringArray(product.images);
  return [...new Set([product.thumbnail, ...parsed].filter(Boolean))];
}
