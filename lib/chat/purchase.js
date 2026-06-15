import { prisma } from "@/lib/prisma";
import { recordInteraction } from "@/lib/chat/interactions";

/**
 * Record purchase + per-line product interactions (deduped by order code).
 * @param {{
 *   visitorKey: string;
 *   customerId?: string | null;
 *   orderId: string;
 *   orderCode: string;
 *   total: number;
 *   items: { productId: string; sellerId?: string | null; categoryId?: string | null; quantity: number }[];
 * }} input
 */
export async function recordPurchaseFromOrder(input) {
  const marker = `"orderCode":"${input.orderCode}"`;
  const existing = await prisma.userInteraction.findFirst({
    where: {
      eventType: "purchase",
      metadata: { contains: marker },
    },
    select: { id: true },
  });
  if (existing) return { recorded: false, reason: "already_recorded" };

  await recordInteraction({
    visitorKey: input.visitorKey,
    customerId: input.customerId ?? null,
    eventType: "purchase",
    path: "/order-success",
    metadata: {
      orderCode: input.orderCode,
      orderId: input.orderId,
      total: input.total,
      itemCount: input.items.length,
    },
  });

  for (const item of input.items) {
    await recordInteraction({
      visitorKey: input.visitorKey,
      customerId: input.customerId ?? null,
      eventType: "purchase",
      productId: item.productId,
      sellerId: item.sellerId ?? null,
      categoryId: item.categoryId ?? null,
      path: "/order-success",
      metadata: {
        orderCode: input.orderCode,
        quantity: item.quantity,
      },
    });
  }

  return { recorded: true };
}

/**
 * @param {string} orderId
 */
export async function getOrderItemsForTracking(orderId) {
  const rows = await prisma.orderItem.findMany({
    where: { orderId },
    select: {
      productId: true,
      quantity: true,
      sellerId: true,
      product: { select: { categoryId: true } },
    },
  });
  return rows.map((r) => ({
    productId: r.productId,
    sellerId: r.sellerId,
    categoryId: r.product?.categoryId ?? null,
    quantity: r.quantity,
  }));
}
