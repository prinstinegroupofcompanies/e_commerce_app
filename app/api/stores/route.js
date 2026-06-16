import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { dbContains } from "@/lib/db-contains";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(24),
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const { q, page, perPage } = parsed.data;
    const qTrim = q?.trim() || "";

    const where = {
      verificationStatus: "approved",
      isShopActive: true,
      isActive: true,
      shopSlug: { not: null },
      ...(qTrim
        ? {
            OR: [
              { shopName: dbContains(qTrim) },
              { shopDescription: dbContains(qTrim) },
              { shopCity: dbContains(qTrim) },
              { shopCounty: dbContains(qTrim) },
              { businessCategory: dbContains(qTrim) },
              { name: dbContains(qTrim) },
            ],
          }
        : {}),
    };

    const [total, rows] = await prisma.$transaction([
      prisma.seller.count({ where }),
      prisma.seller.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: [{ totalOrders: "desc" }, { shopName: "asc" }],
        select: {
          id: true,
          shopName: true,
          shopSlug: true,
          shopLogo: true,
          shopBanner: true,
          shopDescription: true,
          shopCity: true,
          shopCounty: true,
          businessCategory: true,
          totalOrders: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      }),
    ]);

    return jsonSuccess(rows, { total, page, perPage, q: qTrim || null });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
