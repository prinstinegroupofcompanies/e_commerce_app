import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const points = await prisma.pickupPoint.findMany({
    where: { isActive: true },
    orderBy: [{ city: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      country: true,
      phone: true,
      hours: true,
    },
  });
  return jsonSuccess({ points });
}
