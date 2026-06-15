import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1).max(250),
  slug: z.string().max(250).optional(),
  content: z.string().max(50000).optional().nullable(),
  metaTitle: z.string().max(250).optional().nullable(),
  metaDesc: z.string().max(500).optional().nullable(),
  isPublished: z.boolean().default(false),
});

export async function POST(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  if (!slug) return jsonError("Slug required", [], 422);
  const duplicate = await prisma.page.findUnique({ where: { slug } });
  if (duplicate) return jsonError("Slug already exists", [], 409);
  const created = await prisma.page.create({
    data: {
      title: parsed.data.title,
      slug,
      content: parsed.data.content ?? null,
      metaTitle: parsed.data.metaTitle ?? null,
      metaDesc: parsed.data.metaDesc ?? null,
      isPublished: parsed.data.isPublished,
    },
  });
  return jsonSuccess(created, {}, 201);
}
