import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { refundRequestSchema } from "@/lib/validators/refund";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;

  const refunds = await prisma.refund.findMany({
    where: { customerId: gate.session.user.id },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { code: true, total: true } } },
  });

  return jsonSuccess(refunds);
}

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["customer"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = refundRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const customerId = gate.session.user.id;
    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, customerId },
      select: { id: true, total: true, paymentStatus: true },
    });
    if (!order) return jsonError("Order not found", [], 404);

    const pending = await prisma.refund.findFirst({
      where: { orderId: order.id, status: { in: ["pending", "approved"] } },
    });
    if (pending) return jsonError("A refund request already exists for this order", [], 409);

    const amount = parsed.data.amount ?? order.total;

    const refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        customerId,
        amount,
        reason: parsed.data.reason,
        status: "pending",
      },
      include: { order: { select: { code: true } } },
    });

    return jsonSuccess(refund, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
