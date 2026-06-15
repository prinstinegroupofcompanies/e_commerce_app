import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  menuId: z.string().min(1),
  label: z.string().min(1).max(150),
  url: z.string().min(1).max(500),
  target: z.string().max(20).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const menu = await prisma.menu.findUnique({ where: { id: parsed.data.menuId } });
  if (!menu) return jsonError("Menu not found", [], 404);
  const created = await prisma.menuItem.create({
    data: {
      menuId: parsed.data.menuId,
      label: parsed.data.label,
      url: parsed.data.url,
      target: parsed.data.target?.trim() || null,
      sortOrder: parsed.data.sortOrder,
    },
  });
  return jsonSuccess(created, {}, 201);
}
