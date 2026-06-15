import { auth } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { buildChatContext } from "@/lib/chat/context";
import { resolveVisitor, VISITOR_COOKIE } from "@/lib/chat/visitor";
import { SITE_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await auth();
    const headerKey = request.headers.get("x-visitor-key");
    const cookieKey = request.cookies.get(VISITOR_COOKIE)?.value;
    const visitorKey = headerKey || cookieKey;
    if (!visitorKey) return jsonError("Missing visitor key", [], 400);

    const customerId =
      session?.user?.role === "customer" ? session.user.id : null;
    const customerName = session?.user?.name ?? null;

    await resolveVisitor(visitorKey, customerId);

    const ctx = await buildChatContext({
      visitorKey,
      customerId,
      customerName,
      customerEmail: session?.user?.email ?? null,
    });

    const returning =
      ctx.user.behaviorSummary.includes("tracked actions") &&
      !ctx.user.behaviorSummary.includes("New visitor");

    const firstName = customerName ? customerName.split(" ")[0] : null;
    let greeting = `Hi${firstName ? ` ${firstName}` : ""}! I'm your ${SITE_NAME} assistant.`;
    if (returning) {
      greeting += " Welcome back — I picked suggestions based on what you've browsed before.";
    } else {
      greeting += " Ask about products, orders, sellers, or how to use the shop.";
    }

    return jsonSuccess({
      greeting,
      returning,
      recommendations: ctx.recommendations,
      behaviorSummary: ctx.user.behaviorSummary,
    });
  } catch (e) {
    console.error("[chat/welcome]", e);
    return jsonError("Could not load welcome", [], 500);
  }
}
