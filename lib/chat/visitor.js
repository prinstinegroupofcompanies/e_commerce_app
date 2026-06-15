import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const VISITOR_COOKIE = "shoplib_vid";

/**
 * @param {string} visitorKey
 * @param {string | null | undefined} customerId
 */
export async function ensureVisitorProfile(visitorKey, customerId) {
  const existing = await prisma.visitorProfile.findUnique({
    where: { visitorKey },
  });
  if (existing) {
    return prisma.visitorProfile.update({
      where: { visitorKey },
      data: {
        lastSeenAt: new Date(),
        ...(customerId && !existing.customerId ? { customerId } : {}),
      },
    });
  }
  return prisma.visitorProfile.create({
    data: {
      visitorKey,
      customerId: customerId ?? null,
    },
  });
}

/**
 * @param {string | undefined} visitorKeyHeader
 * @param {string | null | undefined} customerId
 */
export async function resolveVisitor(visitorKeyHeader, customerId) {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(VISITOR_COOKIE)?.value;
  const visitorKey = visitorKeyHeader || fromCookie;
  if (!visitorKey) return null;
  return ensureVisitorProfile(visitorKey, customerId);
}
