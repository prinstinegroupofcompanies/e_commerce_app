import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { VISITOR_COOKIE } from "@/lib/chat/visitor";
import { resolveVisitor } from "@/lib/chat/visitor";
import { recordPurchaseFromOrder, getOrderItemsForTracking } from "@/lib/chat/purchase";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderCode: z.string().min(3).max(80).transform((s) => s.trim().toUpperCase()),
  guestEmail: z.string().email().optional(),
});

export async function POST(request) {
  try {
    const session = await auth();
    const headerKey = request.headers.get("x-visitor-key");
    const cookieKey = request.cookies.get(VISITOR_COOKIE)?.value;
    const visitorKey = headerKey || cookieKey;
    if (!visitorKey) return jsonError("Missing visitor key", [], 400);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid order code", parsed.error.flatten().fieldErrors, 422);
    }

    const customerId =
      session?.user?.role === "customer" ? session.user.id : null;

    await resolveVisitor(visitorKey, customerId);

    const order = await prisma.order.findFirst({
      where: { code: parsed.data.orderCode },
      select: {
        id: true,
        code: true,
        total: true,
        customerId: true,
        guestEmail: true,
      },
    });

    if (!order) return jsonError("Order not found", [], 404);

    if (customerId) {
      if (order.customerId !== customerId) {
        return jsonError("Order does not belong to this account", [], 403);
      }
    } else if (parsed.data.guestEmail) {
      const email = parsed.data.guestEmail.toLowerCase();
      if (order.guestEmail?.toLowerCase() !== email) {
        return jsonError("Email does not match order", [], 403);
      }
    }

    const items = await getOrderItemsForTracking(order.id);
    const result = await recordPurchaseFromOrder({
      visitorKey,
      customerId: customerId || order.customerId,
      orderId: order.id,
      orderCode: order.code,
      total: order.total,
      items,
    });

    return jsonSuccess(result);
  } catch (e) {
    console.error("[analytics/purchase]", e);
    return jsonError("Could not record purchase", [], 500);
  }
}
