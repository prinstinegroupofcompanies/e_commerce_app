import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const schema = z.object({
  isPublished: z.boolean().optional(),
  title: z.string().min(1).max(250).optional(),
  slug: z.string().max(250).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  thumbnail: z.string().max(2000).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  metaTitle: z.string().max(250).optional().nullable(),
  metaDesc: z.string().max(500).optional().nullable(),
});

export async function PATCH(request, context) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const { id } = context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const data = { ...parsed.data };
  if (parsed.data.slug) {
    const slug = slugify(parsed.data.slug);
    if (!slug) return jsonError("Invalid slug", [], 422);
    const duplicate = await prisma.blogPost.findFirst({
      where: { slug, NOT: { id } },
    });
    if (duplicate) return jsonError("Slug already exists", [], 409);
    data.slug = slug;
  }
  if (parsed.data.isPublished === true) {
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
    if (existing && !existing.publishedAt) data.publishedAt = new Date();
  }

  const updated = await prisma.blogPost.update({ where: { id }, data });
  return jsonSuccess(updated);
}

export async function DELETE(_request, context) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const { id } = context.params;
  await prisma.blogPost.delete({ where: { id } });
  return jsonSuccess({ deleted: true });
}
