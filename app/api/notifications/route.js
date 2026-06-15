import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function scope(session) {
  return session.user.role === "seller"
    ? { sellerId: session.user.id }
    : { customerId: session.user.id };
}

export async function GET(request) {
  const gate = await requireSessionRoles(["customer", "seller"]);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const onlyUnread = searchParams.get("unread") === "1";

  const where = { ...scope(gate.session), ...(onlyUnread ? { isRead: false } : {}) };
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.notification.count({
      where: { ...scope(gate.session), isRead: false },
    }),
  ]);

  return jsonSuccess({ items, unread });
}

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  markAllRead: z.boolean().optional(),
});

export async function PATCH(request) {
  const gate = await requireSessionRoles(["customer", "seller"]);
  if (!gate.ok) return gate.response;
  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

    if (parsed.data.markAllRead) {
      const result = await prisma.notification.updateMany({
        where: { ...scope(gate.session), isRead: false },
        data: { isRead: true },
      });
      return jsonSuccess({ updated: result.count });
    }

    if (parsed.data.ids?.length) {
      const result = await prisma.notification.updateMany({
        where: { ...scope(gate.session), id: { in: parsed.data.ids } },
        data: { isRead: true },
      });
      return jsonSuccess({ updated: result.count });
    }

    return jsonError("Nothing to update", [], 400);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
