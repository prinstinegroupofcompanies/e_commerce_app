/**
 * @typedef {{
 *   page: number;
 *   perPage: number;
 *   sort: "newest" | "price-asc" | "price-desc" | "rating" | "sold";
 *   categorySlug: string;
 *   brandSlug: string;
 *   minPrice: number | null;
 *   maxPrice: number | null;
 *   minRating: number | null;
 *   view: "grid" | "list";
 * }} ProductListParams
 */

const SORTS = /** @type {const} */ (["newest", "price-asc", "price-desc", "rating", "sold"]);

/**
 * @param {Record<string, string | string[] | undefined>} sp
 * @returns {ProductListParams}
 */
export function parseProductListParams(sp) {
  const rawPage = typeof sp.page === "string" ? sp.page : Array.isArray(sp.page) ? sp.page[0] : "1";
  const rawPer = typeof sp.perPage === "string" ? sp.perPage : Array.isArray(sp.perPage) ? sp.perPage[0] : "24";
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  const perPage = Math.min(48, Math.max(6, parseInt(String(rawPer), 10) || 24));

  const rawSort = typeof sp.sort === "string" ? sp.sort : Array.isArray(sp.sort) ? sp.sort[0] : "newest";
  const sort = SORTS.includes(/** @type {never} */ (rawSort)) ? /** @type {ProductListParams["sort"]} */ (rawSort) : "newest";

  const categorySlug =
    (typeof sp.category === "string" ? sp.category : Array.isArray(sp.category) ? sp.category[0] : "") || "";
  const brandSlug = (typeof sp.brand === "string" ? sp.brand : Array.isArray(sp.brand) ? sp.brand[0] : "") || "";

  const minRaw = typeof sp.minPrice === "string" ? sp.minPrice : Array.isArray(sp.minPrice) ? sp.minPrice[0] : "";
  const maxRaw = typeof sp.maxPrice === "string" ? sp.maxPrice : Array.isArray(sp.maxPrice) ? sp.maxPrice[0] : "";
  const minPrice =
    minRaw === "" || !Number.isFinite(Number(minRaw)) ? null : Math.max(0, Number(minRaw));
  const maxPrice =
    maxRaw === "" || !Number.isFinite(Number(maxRaw)) ? null : Math.max(0, Number(maxRaw));

  const ratingRaw =
    typeof sp.minRating === "string" ? sp.minRating : Array.isArray(sp.minRating) ? sp.minRating[0] : "";
  const minRating =
    ratingRaw === "" || ratingRaw === "any"
      ? null
      : (() => {
          const n = Math.floor(Number(ratingRaw));
          if (!Number.isFinite(n) || n < 1) return null;
          return Math.min(5, n);
        })();

  const viewRaw = typeof sp.view === "string" ? sp.view : Array.isArray(sp.view) ? sp.view[0] : "grid";
  const view = viewRaw === "list" ? "list" : "grid";

  return { page, perPage, sort, categorySlug, brandSlug, minPrice, maxPrice, minRating, view };
}

/** Prisma-friendly visibility: active product + active category/brand when linked. */
export function catalogProductVisibilityWhere() {
  return {
    isActive: true,
    AND: [
      { OR: [{ categoryId: null }, { category: { isActive: true } }] },
      { OR: [{ brandId: null }, { brand: { isActive: true } }] },
    ],
  };
}

/**
 * @param {ProductListParams} p
 */
export function productListOrderBy(p) {
  switch (p.sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "rating":
      return [{ averageRating: "desc" }, { totalReviews: "desc" }];
    case "sold":
      return { totalSold: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

/**
 * @param {import("@prisma/client").Prisma.ProductWhereInput} base
 * @param {ProductListParams} p
 * @param {{ lockedCategoryId?: string | null }} [scope]
 */
export function mergeProductListFilters(base, p, scope) {
  /** @type {import("@prisma/client").Prisma.ProductWhereInput} */
  const where = { ...base, ...catalogProductVisibilityWhere() };

  if (scope?.lockedCategoryId) {
    where.categoryId = scope.lockedCategoryId;
  } else if (p.categorySlug) {
    where.category = { isActive: true, slug: p.categorySlug };
  }

  if (p.brandSlug) {
    where.brand = { isActive: true, slug: p.brandSlug };
  }

  if (p.minRating != null) {
    where.averageRating = { gte: p.minRating };
  }

  const priceFilter = {};
  if (p.minPrice != null && Number.isFinite(p.minPrice) && p.minPrice >= 0) {
    priceFilter.gte = p.minPrice;
  }
  if (p.maxPrice != null && Number.isFinite(p.maxPrice) && p.maxPrice >= 0) {
    priceFilter.lte = p.maxPrice;
  }
  if (Object.keys(priceFilter).length) {
    where.price = priceFilter;
  }

  return where;
}

/**
 * @param {Record<string, string | string[] | undefined>} sp
 */
export function serializeProductListQuery(sp) {
  const o = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined || v === "") continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val === undefined || val === "") continue;
    if (k === "page" && (val === "1" || val === 1)) continue;
    o.set(k, String(val));
  }
  return o.toString();
}
