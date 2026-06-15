import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { categoryCreateBodySchema } from "@/lib/validators/category";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = categoryCreateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const data = parsed.data;

    const dup = await prisma.category.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (dup) return jsonError("Slug already in use", [], 409);

    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId }, select: { id: true } });
      if (!parent) return jsonError("Invalid parent category", [], 422);
    }

    const created = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId ?? null,
        image: data.image ?? null,
        description: data.description ?? null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        isActive: true,
        sortOrder: true,
      },
    });

    return jsonSuccess(created, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
