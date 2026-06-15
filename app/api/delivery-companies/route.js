import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Public list of approved delivery companies for checkout */
export async function GET() {
  const companies = await prisma.deliveryCompany.findMany({
    where: { isActive: true, verificationStatus: "approved" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      city: true,
      county: true,
      standardFee: true,
      expressFee: true,
    },
  });
  return jsonSuccess(companies);
}
