import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSessionRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const ads = await prisma.storeAdvertisement.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      seller: { select: { shopName: true, shopSlug: true, email: true } },
    },
  });
  return jsonSuccess(ads);
}
