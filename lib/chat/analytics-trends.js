import { prisma } from "@/lib/prisma";
import { getInteractionInsights } from "@/lib/chat/interactions";

/**
 * @param {Date} since
 * @param {Date} until
 */
export async function getDailyEventTrend(since, until) {
  const events = await prisma.userInteraction.findMany({
    where: { createdAt: { gte: since, lte: until } },
    select: { createdAt: true, eventType: true },
  });

  /** @type {Map<string, { events: number; purchases: number }>} */
  const countMap = new Map();

  for (const row of events) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const bucket = countMap.get(key) || { events: 0, purchases: 0 };
    bucket.events += 1;
    if (row.eventType === "purchase") bucket.purchases += 1;
    countMap.set(key, bucket);
  }

  const buckets = [];
  const cur = new Date(since);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(until);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    const counts = countMap.get(key) || { events: 0, purchases: 0 };
    buckets.push({
      day: key,
      label: cur.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      events: counts.events,
      purchases: counts.purchases,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return compressTrendBuckets(buckets);
}

/**
 * @param {{ day: string; label: string; events: number; purchases: number }[]} buckets
 */
function compressTrendBuckets(buckets) {
  if (buckets.length <= 45) return buckets;

  /** @type {{ day: string; label: string; events: number; purchases: number }[]} */
  const weekly = [];
  for (let i = 0; i < buckets.length; i += 7) {
    const slice = buckets.slice(i, i + 7);
    weekly.push({
      day: slice[0].day,
      label: `${slice[0].label}`,
      events: slice.reduce((s, b) => s + b.events, 0),
      purchases: slice.reduce((s, b) => s + b.purchases, 0),
    });
  }
  return weekly;
}

/**
 * @param {{ since: Date; until: Date; take?: number }} opts
 */
export async function getTopGuestVisitors({ since, until, take = 12 }) {
  const groups = await prisma.userInteraction.groupBy({
    by: ["visitorKey"],
    where: { createdAt: { gte: since, lte: until }, visitorKey: { not: null } },
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _count: { visitorKey: "desc" } },
    take: take + 5,
  });

  const keys = groups.map((g) => g.visitorKey).filter(Boolean);
  const profiles = keys.length
    ? await prisma.visitorProfile.findMany({
        where: { visitorKey: { in: keys } },
        select: {
          visitorKey: true,
          customerId: true,
          lastSeenAt: true,
          customer: { select: { id: true, name: true, email: true } },
        },
      })
    : [];
  const profileMap = new Map(profiles.map((p) => [p.visitorKey, p]));

  return groups
    .filter((g) => {
      const p = profileMap.get(g.visitorKey);
      return !p?.customerId;
    })
    .slice(0, take)
    .map((g) => ({
      visitorKey: g.visitorKey,
      visitorShort: g.visitorKey?.slice(0, 8) ?? "guest",
      eventCount: g._count._all,
      lastActivityAt: g._max.createdAt,
      profile: profileMap.get(g.visitorKey) ?? null,
    }));
}

/**
 * @param {string} visitorKey
 * @param {{ days?: number; since?: Date; until?: Date }} range
 */
export async function getVisitorBehaviorDetail(visitorKey, range) {
  const days = range.days ?? 30;
  const until = range.until ?? new Date();
  const since = range.since ?? new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

  const profile = await prisma.visitorProfile.findUnique({
    where: { visitorKey },
    select: {
      visitorKey: true,
      customerId: true,
      lastSeenAt: true,
      createdAt: true,
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  const dateWhere = { createdAt: { gte: since, lte: until } };

  const [events, chatSessions, insights, dailyTrend] = await Promise.all([
    prisma.userInteraction.findMany({
      where: { visitorKey, ...dateWhere },
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
        customerId: true,
      },
    }),
    prisma.chatSession.findMany({
      where: { visitorKey, ...dateWhere },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 3 } },
    }),
    getInteractionInsights(visitorKey, profile?.customerId ?? null),
    getDailyEventTrend(since, until),
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

  let orders = [];
  if (profile?.customerId) {
    orders = await prisma.order.findMany({
      where: { customerId: profile.customerId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, code: true, total: true, orderStatus: true, createdAt: true },
    });
  }

  return {
    days,
    since,
    until,
    visitorKey,
    visitorShort: visitorKey?.slice(0, 12) ?? "unknown",
    profile,
    insights,
    eventCount: events.length,
    eventBreakdown,
    dailyTrend,
    events: events.map((e) => ({
      ...e,
      product: e.productId ? productMap.get(e.productId) : null,
    })),
    orders,
    chatSessions,
  };
}
