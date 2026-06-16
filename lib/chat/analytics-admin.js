import { prisma } from "@/lib/prisma";
import { getInteractionInsights } from "@/lib/chat/interactions";
import { getDailyEventTrend, getTopGuestVisitors } from "@/lib/chat/analytics-trends";

/**
 * @param {{ days?: number; since?: Date; until?: Date }} range
 */
function resolveRange(range = {}) {
  const days = range.days ?? 30;
  const until = range.until ?? new Date();
  const since = range.since ?? new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return { days, since, until };
}

/**
 * @param {{ days?: number; since?: Date; until?: Date }} [range]
 */
export async function getAdminAnalyticsSummary(range = {}) {
  const { days, since, until } = resolveRange(range);
  const dateWhere = { createdAt: { gte: since, lte: until } };

  const [
    totalEvents,
    eventGroups,
    distinctVisitors,
    topProductGroups,
    topSellerGroups,
    recentEvents,
    chatSessionCount,
    chatMessageCount,
    visitorProfileCount,
    funnel,
  ] = await Promise.all([
    prisma.userInteraction.count({ where: dateWhere }),
    prisma.userInteraction.groupBy({
      by: ["eventType"],
      where: dateWhere,
      _count: { _all: true },
      orderBy: { _count: { eventType: "desc" } },
    }),
    prisma.userInteraction.findMany({
      where: dateWhere,
      distinct: ["visitorKey"],
      select: { visitorKey: true },
    }),
    prisma.userInteraction.groupBy({
      by: ["productId"],
      where: { ...dateWhere, productId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),
    prisma.userInteraction.groupBy({
      by: ["sellerId"],
      where: { ...dateWhere, sellerId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { sellerId: "desc" } },
      take: 8,
    }),
    prisma.userInteraction.findMany({
      where: dateWhere,
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        eventType: true,
        visitorKey: true,
        customerId: true,
        productId: true,
        path: true,
        createdAt: true,
      },
    }),
    prisma.chatSession.count({ where: dateWhere }),
    prisma.chatMessage.count({ where: dateWhere }),
    prisma.visitorProfile.count({ where: { lastSeenAt: { gte: since, lte: until } } }),
    Promise.all(
      ["page_view", "view_product", "add_to_cart", "wishlist_add", "compare_add", "purchase", "review", "chat_open"].map(
        async (eventType) => ({
          eventType,
          count: await prisma.userInteraction.count({
            where: { ...dateWhere, eventType },
          }),
        })
      )
    ),
  ]);

  const productIds = topProductGroups.map((g) => g.productId).filter(Boolean);
  const sellerIds = topSellerGroups.map((g) => g.sellerId).filter(Boolean);

  const [products, sellers, customers] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true },
        })
      : [],
    sellerIds.length
      ? prisma.seller.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, shopName: true, name: true },
        })
      : [],
    recentEvents.some((e) => e.customerId)
      ? prisma.customer.findMany({
          where: { id: { in: [...new Set(recentEvents.map((e) => e.customerId).filter(Boolean))] } },
          select: { id: true, name: true, email: true },
        })
      : [],
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const linkedCustomers = await prisma.visitorProfile.count({
    where: { customerId: { not: null }, lastSeenAt: { gte: since, lte: until } },
  });

  const [topCustomers, dailyTrend, topGuests] = await Promise.all([
    getTopCustomersByActivity({ since, until, take: 12 }),
    getDailyEventTrend(since, until),
    getTopGuestVisitors({ since, until, take: 12 }),
  ]);

  return {
    days,
    since,
    until,
    totalEvents,
    uniqueVisitors: distinctVisitors.length,
    visitorProfiles: visitorProfileCount,
    linkedCustomers,
    chatSessions: chatSessionCount,
    chatMessages: chatMessageCount,
    eventBreakdown: eventGroups.map((g) => ({
      eventType: g.eventType,
      count: g._count._all,
    })),
    funnel,
    topProducts: topProductGroups.map((g) => ({
      productId: g.productId,
      count: g._count._all,
      product: g.productId ? productMap.get(g.productId) : null,
    })),
    topSellers: topSellerGroups.map((g) => ({
      sellerId: g.sellerId,
      count: g._count._all,
      seller: g.sellerId ? sellerMap.get(g.sellerId) : null,
    })),
    recentEvents: recentEvents.map((e) => ({
      ...e,
      product: e.productId ? productMap.get(e.productId) : null,
      customer: e.customerId ? customerMap.get(e.customerId) : null,
      visitorShort: e.visitorKey?.slice(0, 8) ?? "guest",
    })),
    topCustomers,
    topGuests,
    dailyTrend,
  };
}

/**
 * @param {{ since: Date; until: Date; take?: number }} opts
 */
export async function getTopCustomersByActivity({ since, until, take = 15 }) {
  const groups = await prisma.userInteraction.groupBy({
    by: ["customerId"],
    where: {
      createdAt: { gte: since, lte: until },
      customerId: { not: null },
    },
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _count: { customerId: "desc" } },
    take,
  });

  const ids = groups.map((g) => g.customerId).filter(Boolean);
  if (!ids.length) return [];

  const customers = await prisma.customer.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });
  const map = new Map(customers.map((c) => [c.id, c]));

  return groups.map((g) => ({
    customerId: g.customerId,
    eventCount: g._count._all,
    lastActivityAt: g._max.createdAt,
    customer: g.customerId ? map.get(g.customerId) : null,
  }));
}

/**
 * @param {string} customerId
 * @param {{ days?: number; since?: Date; until?: Date }} [range]
 */
export async function getCustomerBehaviorDetail(customerId, range = {}) {
  const { days, since, until } = resolveRange(range);

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!customer) return null;

  const profile = await prisma.visitorProfile.findUnique({
    where: { customerId },
    select: { visitorKey: true, lastSeenAt: true, createdAt: true },
  });

  const eventWhere = {
    createdAt: { gte: since, lte: until },
    OR: [
      { customerId },
      ...(profile?.visitorKey ? [{ visitorKey: profile.visitorKey }] : []),
    ],
  };

  const [events, orders, chatSessions, insights] = await Promise.all([
    prisma.userInteraction.findMany({
      where: eventWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        eventType: true,
        productId: true,
        sellerId: true,
        path: true,
        metadata: true,
        createdAt: true,
        visitorKey: true,
      },
    }),
    prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        code: true,
        total: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.chatSession.findMany({
      where: {
        customerId,
        createdAt: { gte: since, lte: until },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    }),
    profile?.visitorKey
      ? getInteractionInsights(profile.visitorKey, customerId)
      : getInteractionInsights(`cust_${customerId}`, customerId),
  ]);

  const productIds = [...new Set(events.map((e) => e.productId).filter(Boolean))];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const eventBreakdown = events.reduce((acc, e) => {
    acc[e.eventType] = (acc[e.eventType] ?? 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  return {
    days,
    since,
    until,
    customer,
    profile,
    insights,
    eventCount: events.length,
    eventBreakdown,
    events: events.map((e) => ({
      ...e,
      product: e.productId ? productMap.get(e.productId) : null,
    })),
    orders,
    chatSessions,
  };
}

/**
 * @param {{ since: Date; until: Date; limit?: number }} opts
 */
export async function getEventsForExport({ since, until, limit = 5000 }) {
  const events = await prisma.userInteraction.findMany({
    where: { createdAt: { gte: since, lte: until } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      eventType: true,
      visitorKey: true,
      customerId: true,
      productId: true,
      sellerId: true,
      categoryId: true,
      path: true,
      metadata: true,
    },
  });

  const productIds = [...new Set(events.map((e) => e.productId).filter(Boolean))];
  const customerIds = [...new Set(events.map((e) => e.customerId).filter(Boolean))];
  const sellerIds = [...new Set(events.map((e) => e.sellerId).filter(Boolean))];

  const [products, customers, sellers] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } })
      : [],
    customerIds.length
      ? prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, email: true } })
      : [],
    sellerIds.length
      ? prisma.seller.findMany({ where: { id: { in: sellerIds } }, select: { id: true, shopName: true, name: true } })
      : [],
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));

  return events.map((e) => ({
    ...e,
    productName: e.productId ? productMap.get(e.productId)?.name ?? "" : "",
    productSlug: e.productId ? productMap.get(e.productId)?.slug ?? "" : "",
    customerName: e.customerId ? customerMap.get(e.customerId)?.name ?? "" : "",
    customerEmail: e.customerId ? customerMap.get(e.customerId)?.email ?? "" : "",
    sellerName: e.sellerId
      ? sellerMap.get(e.sellerId)?.shopName || sellerMap.get(e.sellerId)?.name || ""
      : "",
  }));
}

