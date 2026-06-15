import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";
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
      AND: [
        catalogProductVisibilityWhere(),
        {
          OR: [
            { name: { contains: q } },
            { shortDescription: { contains: q } },
            { description: { contains: q } },
          ],
        },
      ],
    };

    const [total, rows] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          thumbnail: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
      }),
    ]);

    return jsonSuccess(rows, { total, page, perPage, q });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
