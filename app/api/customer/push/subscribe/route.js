import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request) {
  const auth = await requireSessionRoles(["customer"]);
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid subscription", parsed.error.flatten().fieldErrors, 422);

  const ua = request.headers.get("user-agent");

  await prisma.pushSubscription.upsert({
    where: {
      customerId_endpoint: {
        customerId: auth.session.user.id,
        endpoint: parsed.data.endpoint,
      },
    },
    create: {
      customerId: auth.session.user.id,
      endpoint: parsed.data.endpoint,
      keys: JSON.stringify(parsed.data.keys),
      userAgent: ua,
    },
    update: {
      keys: JSON.stringify(parsed.data.keys),
      userAgent: ua,
    },
  });

  return jsonSuccess({ subscribed: true });
}

export async function DELETE(request) {
  const auth = await requireSessionRoles(["customer"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const endpoint = body?.endpoint;
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { customerId: auth.session.user.id, endpoint },
    });
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { customerId: auth.session.user.id },
    });
  }
  return jsonSuccess({ unsubscribed: true });
}
