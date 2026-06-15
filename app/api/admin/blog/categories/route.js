import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().max(150).optional(),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);
  if (!slug) return jsonError("Slug required", [], 422);
  const duplicate = await prisma.blogCategory.findUnique({ where: { slug } });
  if (duplicate) return jsonError("Slug already exists", [], 409);
  const created = await prisma.blogCategory.create({ data: { name: parsed.data.name, slug } });
  return jsonSuccess(created, {}, 201);
}
