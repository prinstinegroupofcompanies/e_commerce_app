import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ordersWhereForTab } from "@/lib/admin-orders";
import { AdminOrdersListClient } from "@/components/admin/admin-orders-list-client";

/** @param {{ tab: import("@/lib/admin-orders").OrdersTab; title: string; description: string }} props */
export async function AdminOrdersList({ tab, title, description }) {
  await auth();
  const where = ordersWhereForTab(tab);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      customer: { select: { name: true, email: true } },
      pickupPoint: { select: { name: true, city: true } },
      _count: { select: { items: true } },
    },
  });

  const serialized = orders.map((o) => ({
    id: o.id,
    code: o.code,
    createdAt: o.createdAt.toISOString(),
    customerName: o.customer?.name || o.guestName || "",
    customerEmail: o.customer?.email || o.guestEmail || "",
    itemCount: o._count.items,
    total: o.total,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    isPickup: o.isPickup,
    pickupPointName: o.pickupPoint?.name || null,
    pickupCity: o.pickupPoint?.city || null,
  }));

  return <AdminOrdersListClient tab={tab} title={title} description={description} orders={serialized} />;
}
