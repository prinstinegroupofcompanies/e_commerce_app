import { prisma } from "@/lib/prisma";
import { requireSessionRoles } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const exportable = [
  "admin",
  "customer",
  "seller",
  "category",
  "brand",
  "product",
  "order",
  "orderItem",
  "orderStatusHistory",
  "transaction",
  "walletTransaction",
  "payout",
  "coupon",
  "review",
  "blogPost",
  "blogCategory",
  "blogTag",
  "page",
  "setting",
  "taxProfile",
  "taxRate",
  "currency",
  "language",
  "shippingProfile",
  "shippingZone",
  "shippingRate",
  "shippingCarrier",
  "pickupPoint",
  "paymentMethod",
  "menu",
  "menuItem",
  "banner",
  "collection",
  "flashDeal",
  "flashDealItem",
  "notification",
  "address",
  "wishlistItem",
  "refundRequest",
];

export async function GET() {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  try {
    /** @type {Record<string, unknown[]>} */
    const data = {};
    for (const model of exportable) {
      if (typeof prisma[model]?.findMany === "function") {
        data[model] = await prisma[model].findMany();
      }
    }

    const filename = `markay-hall-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("[backup]", e);
    return jsonError("Backup failed", [], 500);
  }
}
