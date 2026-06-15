import { prisma } from "@/lib/prisma";

/**
 * Credit seller wallet when delivery is confirmed (Markay Hall settlement).
 * @param {string} orderId
 */
export async function settleSellerEarningsForOrder(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId, sellerId: { not: null }, paymentStatus: { not: "settled" } },
    select: { id: true, sellerId: true, sellerEarning: true },
  });
  if (items.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const line of items) {
      if (!line.sellerId || line.sellerEarning <= 0) continue;
      const seller = await tx.seller.update({
        where: { id: line.sellerId },
        data: {
          walletBalance: { increment: line.sellerEarning },
          totalEarnings: { increment: line.sellerEarning },
        },
        select: { walletBalance: true },
      });
      await tx.walletTransaction.create({
        data: {
          sellerId: line.sellerId,
          type: "credit",
          amount: line.sellerEarning,
          balance: seller.walletBalance,
          description: `Order settlement`,
          reference: orderId,
        },
      });
      await tx.orderItem.update({
        where: { id: line.id },
        data: { paymentStatus: "settled" },
      });
    }
  });
}
