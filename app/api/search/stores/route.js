import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const { q, page, perPage } = parsed.data;

    const where = {
      verificationStatus: "approved",
      isShopActive: true,
      isActive: true,
      OR: [
        { shopName: { contains: q } },
        { shopDescription: { contains: q } },
        { shopCity: { contains: q } },
        { shopCounty: { contains: q } },
        { businessCategory: { contains: q } },
      ],
    };

    const [total, rows] = await prisma.$transaction([
      prisma.seller.count({ where }),
      prisma.seller.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { totalOrders: "desc" },
        select: {
          id: true,
          shopName: true,
          shopSlug: true,
          shopLogo: true,
          shopCity: true,
          shopCounty: true,
          businessCategory: true,
          totalOrders: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      }),
    ]);

    return jsonSuccess(rows, { total, page, perPage, q });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
