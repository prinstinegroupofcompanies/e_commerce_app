import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSessionRoles(["delivery"]);
  if (!auth.ok) return auth.response;
  const companyId = auth.session.user.id;

  const assignments = await prisma.deliveryAssignment.findMany({
    where: { deliveryCompanyId: companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: { select: { code: true, paymentStatus: true, orderStatus: true, deliveryOtp: true } },
      seller: { select: { shopName: true, shopCity: true, phone: true } },
      rider: { select: { id: true, name: true, phone: true } },
    },
  });

  return jsonSuccess(assignments);
}
