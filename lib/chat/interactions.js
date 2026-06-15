import { prisma } from "@/lib/prisma";

const EVENT_WEIGHTS = {
  purchase: 12,
  add_to_cart: 6,
  wishlist_add: 5,
  compare_add: 4,
  view_product: 3,
  search: 2,
  view_shop: 2,
  page_view: 1,
  review: 4,
  scroll_depth: 1,
  chat_open: 2,
};

/**
 * @param {{
 *   visitorKey: string;
 *   customerId?: string | null;
 *   eventType: string;
 *   productId?: string | null;
 *   sellerId?: string | null;
 *   categoryId?: string | null;
 *   path?: string | null;
 *   metadata?: Record<string, unknown> | null;
 * }} input
 */
export async function recordInteraction(input) {
  const row = await prisma.userInteraction.create({
    data: {
      visitorKey: input.visitorKey,
      customerId: input.customerId ?? null,
      eventType: input.eventType,
      productId: input.productId ?? null,
      sellerId: input.sellerId ?? null,
      categoryId: input.categoryId ?? null,
      path: input.path ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  await prisma.visitorProfile.updateMany({
    where: { visitorKey: input.visitorKey },
    data: { lastSeenAt: new Date() },
  });

  return row;
}

/**
 * @param {string} visitorKey
 * @param {string | null | undefined} customerId
 */
export async function getInteractionInsights(visitorKey, customerId) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const where = {
    createdAt: { gte: since },
    OR: [{ visitorKey }, ...(customerId ? [{ customerId }] : [])],
  };

  const events = await prisma.userInteraction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      eventType: true,
      productId: true,
      sellerId: true,
      categoryId: true,
      metadata: true,
      createdAt: true,
    },
  });

  /** @type {Record<string, number>} */
  const productScores = {};
  /** @type {Record<string, number>} */
  const sellerScores = {};
  /** @type {Record<string, number>} */
  const categoryScores = {};
  const recentProductIds = [];
  const searches = [];

  for (const e of events) {
    const w = EVENT_WEIGHTS[e.eventType] ?? 1;
    if (e.productId) {
      productScores[e.productId] = (productScores[e.productId] ?? 0) + w;
      if (recentProductIds.length < 12 && !recentProductIds.includes(e.productId)) {
        recentProductIds.push(e.productId);
      }
    }
    if (e.sellerId) sellerScores[e.sellerId] = (sellerScores[e.sellerId] ?? 0) + w;
    if (e.categoryId) categoryScores[e.categoryId] = (categoryScores[e.categoryId] ?? 0) + w;
    if (e.eventType === "search" && e.metadata) {
      try {
        const m = JSON.parse(e.metadata);
        if (m.query) searches.push(String(m.query));
      } catch {
        /* ignore */
      }
    }
  }

  const topProductIds = Object.entries(productScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const topSellerIds = Object.entries(sellerScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topCategoryIds = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return {
    eventCount: events.length,
    recentProductIds,
    topProductIds,
    topSellerIds,
    topCategoryIds,
    recentSearches: searches.slice(0, 5),
    eventBreakdown: events.reduce((acc, e) => {
      acc[e.eventType] = (acc[e.eventType] ?? 0) + 1;
      return acc;
    }, /** @type {Record<string, number>} */ ({})),
  };
}
