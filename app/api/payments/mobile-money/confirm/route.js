import { z } from "zod";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { confirmMobileMoneyPayment } from "@/lib/mobile-money";
import { alertCustomer, formatOrderSms } from "@/lib/marketplace-notify";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  reference: z.string().min(4),
});

/** Admin confirms mobile-money payment (until provider webhook is connected). */
export async function POST(request) {
  const auth = await requireSessionRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid reference", parsed.error.flatten().fieldErrors, 422);

  const result = await confirmMobileMoneyPayment(parsed.data.reference);
  if (!result.ok) return jsonError("Payment reference not found or already confirmed", [], 404);

  const order = await prisma.order.findUnique({
    where: { id: result.orderId },
    select: { id: true, code: true, customerId: true },
  });

  if (order?.customerId) {
    await alertCustomer({
      customerId: order.customerId,
      orderId: order.id,
      title: "Payment received",
      message: `Payment for order ${order.code} was confirmed.`,
      smsBody: formatOrderSms(order.code, "Your mobile money payment was received."),
      type: "success",
      link: `/dashboard/orders/${order.id}`,
    });
  }

  return jsonSuccess({ confirmed: true, orderId: result.orderId, orderCode: order?.code });
}
