import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

/**
 * @param {{ sellerId: string; body: string }}
 */
export async function smsSeller({ sellerId, body }) {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { phone: true, shopName: true },
  });
  if (!seller?.phone?.trim()) return { skipped: true, reason: "no_phone" };
  return sendSms({ to: seller.phone, body });
}

/**
 * @param {string[]} sellerIds
 * @param {string} body
 */
export async function smsSellers(sellerIds, body) {
  const unique = [...new Set(sellerIds.filter(Boolean))];
  await Promise.all(unique.map((id) => smsSeller({ sellerId: id, body })));
}
