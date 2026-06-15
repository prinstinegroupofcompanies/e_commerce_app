import { prisma } from "@/lib/prisma";
import { requireSessionRoles } from "@/lib/api-auth";
import { ordersWhereForTab } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const rawTab = (searchParams.get("tab") || "all").toLowerCase();
  const tab = ["all", "inhouse", "seller", "pickup"].includes(rawTab) ? rawTab : "all";

  const where = ordersWhereForTab(tab);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      customer: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });

  const header = [
    "code",
    "createdAt",
    "customerName",
    "customerEmail",
    "items",
    "subtotal",
    "shippingCost",
    "discount",
    "tax",
    "total",
    "paymentMethod",
    "paymentStatus",
    "orderStatus",
    "isPickup",
    "couponCode",
    "trackingId",
  ];

  const lines = [header.join(",")];
  for (const o of orders) {
    const row = [
      o.code,
      o.createdAt.toISOString(),
      o.customer?.name || o.guestName || "",
      o.customer?.email || o.guestEmail || "",
      o._count.items,
      o.subtotal.toFixed(2),
      o.shippingCost.toFixed(2),
      o.discount.toFixed(2),
      o.tax.toFixed(2),
      o.total.toFixed(2),
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      o.isPickup ? "true" : "false",
      o.couponCode || "",
      o.trackingId || "",
    ].map(csvEscape);
    lines.push(row.join(","));
  }

  const csv = lines.join("\n") + "\n";
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${tab}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
