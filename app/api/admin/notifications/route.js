import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  audience: z.enum(["all-customers", "all-sellers", "customer", "seller"]),
  customerId: z.string().optional().nullable(),
  sellerId: z.string().optional().nullable(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  link: z.string().max(2000).optional().nullable(),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const { audience, customerId, sellerId, title, message, type, link } = parsed.data;
  const link_ = link?.trim() || null;

  let recipients = [];
  if (audience === "all-customers") {
    const customers = await prisma.customer.findMany({ where: { isActive: true }, select: { id: true } });
    recipients = customers.map((c) => ({ customerId: c.id, sellerId: null }));
  } else if (audience === "all-sellers") {
    const sellers = await prisma.seller.findMany({ where: { isActive: true }, select: { id: true } });
    recipients = sellers.map((s) => ({ customerId: null, sellerId: s.id }));
  } else if (audience === "customer") {
    if (!customerId) return jsonError("customerId required", [], 422);
    recipients = [{ customerId, sellerId: null }];
  } else {
    if (!sellerId) return jsonError("sellerId required", [], 422);
    recipients = [{ customerId: null, sellerId }];
  }

  if (recipients.length === 0) return jsonError("No active recipients", [], 422);

  const created = await prisma.notification.createMany({
    data: recipients.map((r) => ({ ...r, title, message, type, link: link_ })),
  });
  return jsonSuccess({ delivered: created.count });
}
