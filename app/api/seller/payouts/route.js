import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["bank", "paypal", "stripe", "wire"]).default("bank"),
  notes: z.string().max(1000).optional().nullable(),
});

export async function GET() {
  const gate = await requireSessionRoles(["seller"]);
  if (!gate.ok) return gate.response;
  const payouts = await prisma.payout.findMany({
    where: { sellerId: gate.session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonSuccess(payouts);
}

export async function POST(request) {
  const gate = await requireSessionRoles(["seller"]);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

    const seller = await prisma.seller.findUnique({
      where: { id: gate.session.user.id },
      select: { walletBalance: true },
    });
    if (!seller) return jsonError("Seller not found", [], 404);

    if (parsed.data.amount > seller.walletBalance) {
      return jsonError("Requested amount exceeds wallet balance", [], 422);
    }

    const minSetting = await prisma.setting.findUnique({ where: { key: "min_payout_amount" } });
    const min = Number(minSetting?.value ?? "20");
    if (parsed.data.amount < min) {
      return jsonError(`Minimum payout is $${min}`, [], 422);
    }

    const created = await prisma.payout.create({
      data: {
        sellerId: gate.session.user.id,
        amount: parsed.data.amount,
        method: parsed.data.method,
        status: "pending",
        notes: parsed.data.notes?.trim() || null,
      },
    });
    return jsonSuccess(created, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
