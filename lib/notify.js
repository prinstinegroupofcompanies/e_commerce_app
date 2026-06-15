import { prisma } from "@/lib/prisma";

/**
 * @typedef {"info" | "success" | "warning" | "error"} NotifyType
 */

/**
 * @param {{
 *   customerId?: string | null;
 *   sellerId?: string | null;
 *   title: string;
 *   message: string;
 *   type?: NotifyType;
 *   link?: string | null;
 * }} input
 */
export async function notify({ customerId = null, sellerId = null, title, message, type = "info", link = null }) {
  if (!customerId && !sellerId) return null;
  try {
    return await prisma.notification.create({
      data: { customerId, sellerId, title, message, type, link },
    });
  } catch (err) {
    console.error("[notify] failed", err);
    return null;
  }
}

/**
 * @param {{
 *   customerIds?: string[];
 *   sellerIds?: string[];
 *   title: string;
 *   message: string;
 *   type?: NotifyType;
 *   link?: string | null;
 * }} input
 */
export async function notifyMany({ customerIds = [], sellerIds = [], title, message, type = "info", link = null }) {
  const rows = [
    ...customerIds.map((id) => ({ customerId: id, sellerId: null, title, message, type, link })),
    ...sellerIds.map((id) => ({ customerId: null, sellerId: id, title, message, type, link })),
  ];
  if (rows.length === 0) return { count: 0 };
  try {
    return await prisma.notification.createMany({ data: rows });
  } catch (err) {
    console.error("[notifyMany] failed", err);
    return { count: 0 };
  }
}
