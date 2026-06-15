import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(10).transform((s) => s.toUpperCase()),
  symbol: z.string().min(1).max(10),
  exchangeRate: z.coerce.number().positive().default(1),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const duplicate = await prisma.currency.findUnique({ where: { code: parsed.data.code } });
  if (duplicate) return jsonError("Currency code already exists", [], 409);

  const created = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.currency.updateMany({ data: { isDefault: false } });
    return tx.currency.create({ data: parsed.data });
  });
  return jsonSuccess(created, {}, 201);
}
