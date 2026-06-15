import { z } from "zod";
import { auth } from "@/lib/auth";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { ensureVisitorProfile, VISITOR_COOKIE } from "@/lib/chat/visitor";

export const dynamic = "force-dynamic";

const schema = z.object({
  visitorKey: z.string().min(8).max(128),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid visitor key", [], 422);

    const session = await auth();
    const customerId =
      session?.user?.role === "customer" ? session.user.id : null;

    await ensureVisitorProfile(parsed.data.visitorKey, customerId);

    const res = jsonSuccess({ ok: true });
    res.headers.set(
      "Set-Cookie",
      `${VISITOR_COOKIE}=${parsed.data.visitorKey}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
    );
    return res;
  } catch (e) {
    console.error("[chat/visitor]", e);
    return jsonError("Could not register visitor", [], 500);
  }
}
