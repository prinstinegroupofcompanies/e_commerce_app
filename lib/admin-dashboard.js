import { prisma } from "@/lib/prisma";

/**
 * @param {{ days?: number }} [opts]
 */
export async function getAdminDashboardStats(opts = {}) {
  const days = opts.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    products,
    orders,
    customers,
    sellers,
    pendingRefunds,
    pendingSellers,
    revenueAgg,
    ordersInPeriod,
    recentOrders,
    topSellers,
    orderStatusGroups,
    paymentStatusGroups,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.seller.count({ where: { isActive: true } }),
    prisma.refund.count({ where: { status: "pending" } }),
    prisma.seller.count({ where: { verificationStatus: "pending" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: { in: ["paid", "completed"] } } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, total: true, paymentStatus: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        code: true,
        total: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
        customer: { select: { name: true, email: true } },
      },
    }),
    prisma.seller.findMany({
      where: { verificationStatus: "approved", isShopActive: true },
      orderBy: { totalOrders: "desc" },
      take: 6,
      select: {
        id: true,
        shopName: true,
        shopSlug: true,
        totalOrders: true,
        shopCity: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    }),
    prisma.order.groupBy({
      by: ["orderStatus"],
      _count: { _all: true },
      orderBy: { _count: { orderStatus: "desc" } },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { _all: true },
      orderBy: { _count: { paymentStatus: "desc" } },
    }),
  ]);

  /** @type {Map<string, { orders: number; revenue: number }>} */
  const daily = new Map();
  for (const o of ordersInPeriod) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const row = daily.get(key) || { orders: 0, revenue: 0 };
    row.orders += 1;
    if (["paid", "completed"].includes(o.paymentStatus)) row.revenue += o.total;
    daily.set(key, row);
  }

  const trend = [];
  const cur = new Date(since);
  cur.setHours(0, 0, 0, 0);
  const end = new Date();
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    const row = daily.get(key) || { orders: 0, revenue: 0 };
    trend.push({
      label: cur.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      orders: row.orders,
      revenue: Math.round(row.revenue * 100) / 100,
    });
    cur.setDate(cur.getDate() + 1);
  }

  const periodRevenue = ordersInPeriod.reduce(
    (sum, o) => (["paid", "completed"].includes(o.paymentStatus) ? sum + o.total : sum),
    0
  );

  return {
    days,
    totals: {
      products,
      orders,
      customers,
      sellers,
      pendingRefunds,
      pendingSellers,
      lifetimeRevenue: revenueAgg._sum.total ?? 0,
      periodRevenue: Math.round(periodRevenue * 100) / 100,
      periodOrders: ordersInPeriod.length,
    },
    trend,
    recentOrders,
    topSellers,
    orderStatusGroups: orderStatusGroups.map((g) => ({
      status: g.orderStatus,
      count: g._count._all,
    })),
    paymentStatusGroups: paymentStatusGroups.map((g) => ({
      status: g.paymentStatus,
      count: g._count._all,
    })),
  };
}
