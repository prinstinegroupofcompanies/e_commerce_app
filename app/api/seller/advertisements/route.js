import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  image: z.string().max(2000).optional().nullable(),
  link: z.string().max(500).optional().nullable(),
  placement: z.enum([
    "homepage_banner",
    "slideshow",
    "featured_product",
    "sponsored_store",
    "popup",
  ]),
  durationDays: z.coerce.number().int().min(1).max(90).default(7),
  amount: z.coerce.number().min(0).default(0),
});

export async function GET() {
  const auth = await requireSessionRoles(["seller"]);
  if (!auth.ok) return auth.response;

  const ads = await prisma.storeAdvertisement.findMany({
    where: { sellerId: auth.session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return jsonSuccess(ads);
}

export async function POST(request) {
  const auth = await requireSessionRoles(["seller"]);
  if (!auth.ok) return auth.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const ad = await prisma.storeAdvertisement.create({
    data: {
      sellerId: auth.session.user.id,
      ...parsed.data,
      status: "pending",
    },
  });

  return jsonSuccess(ad, {}, 201);
}
