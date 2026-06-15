import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(150),
  location: z.string().min(1).max(100),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const duplicate = await prisma.menu.findUnique({ where: { location: parsed.data.location } });
  if (duplicate) return jsonError("Menu location already exists", [], 409);
  const created = await prisma.menu.create({ data: parsed.data });
  return jsonSuccess(created, {}, 201);
}
