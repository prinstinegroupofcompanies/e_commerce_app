import { z } from "zod";
import { auth } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { recordInteraction } from "@/lib/chat/interactions";
import { resolveVisitor, VISITOR_COOKIE } from "@/lib/chat/visitor";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  eventType: z.string().min(1).max(64),
  productId: z.string().optional().nullable(),
  sellerId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  customerId: z.string().optional().nullable(),
});

const bodySchema = z.object({
  events: z.array(eventSchema).min(1).max(40),
});

export async function POST(request) {
  try {
    const session = await auth();
    const headerKey = request.headers.get("x-visitor-key");
    const cookieKey = request.cookies.get(VISITOR_COOKIE)?.value;
    const visitorKey = headerKey || cookieKey;
    if (!visitorKey) return jsonError("Missing visitor key", [], 400);

    const customerId =
      session?.user?.role === "customer" ? session.user.id : null;

    await resolveVisitor(visitorKey, customerId);

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid events payload", parsed.error.flatten().fieldErrors, 422);
    }

    for (const ev of parsed.data.events) {
      await recordInteraction({
        visitorKey,
        customerId: ev.customerId || customerId,
        eventType: ev.eventType,
        productId: ev.productId ?? null,
        sellerId: ev.sellerId ?? null,
        categoryId: ev.categoryId ?? null,
        path: ev.path ?? null,
        metadata: ev.metadata ?? null,
      });
    }

    return jsonSuccess({ recorded: parsed.data.events.length });
  } catch (e) {
    console.error("[analytics/events]", e);
    return jsonError("Could not record events", [], 500);
  }
}
