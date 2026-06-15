import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(50),
  email: z.string().email().optional().nullable(),
});

export async function GET() {
  const auth = await requireSessionRoles(["delivery"]);
  if (!auth.ok) return auth.response;

  const riders = await prisma.deliveryRider.findMany({
    where: { companyId: auth.session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });
  return jsonSuccess(riders);
}

export async function POST(request) {
  const auth = await requireSessionRoles(["delivery"]);
  if (!auth.ok) return auth.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const rider = await prisma.deliveryRider.create({
    data: {
      companyId: auth.session.user.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email?.trim() || null,
    },
  });
  return jsonSuccess(rider, {}, 201);
}
