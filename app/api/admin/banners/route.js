import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1).max(200),
  image: z.string().min(1).max(2000),
  link: z.string().max(2000).optional().nullable(),
  position: z.string().max(50).default("homepage"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const created = await prisma.banner.create({ data: { ...parsed.data, link: parsed.data.link?.trim() || null } });
  return jsonSuccess(created, {}, 201);
}
