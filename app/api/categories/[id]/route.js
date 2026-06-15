import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { categoryUpdateBodySchema } from "@/lib/validators/category";

export const dynamic = "force-dynamic";

/**
 * @param {string | null} startId
 * @param {string} walkId
 */
async function categoryChainContains(prismaClient, startId, walkId) {
  let cur = startId;
  const seen = new Set();
  while (cur) {
    if (cur === walkId) return true;
    if (seen.has(cur)) return true;
    seen.add(cur);
    const row = await prismaClient.category.findUnique({
      where: { id: cur },
      select: { parentId: true },
    });
    cur = row?.parentId ?? null;
  }
  return false;
}

export async function GET(_request, { params }) {
  try {
    const id = params.id;
    if (!id) return jsonError("Missing id", [], 400);

    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const row = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true, children: true } },
      },
    });
    if (!row) return jsonError("Not found", [], 404);

    return jsonSuccess(row);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const id = params.id;
    if (!id) return jsonError("Missing id", [], 400);

    const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return jsonError("Not found", [], 404);

    const body = await request.json();
    const parsed = categoryUpdateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const data = parsed.data;

    if (data.slug !== undefined && data.slug !== existing.slug) {
      const dup = await prisma.category.findUnique({ where: { slug: data.slug }, select: { id: true } });
      if (dup && dup.id !== id) return jsonError("Slug already in use", [], 409);
    }

    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) return jsonError("Category cannot be its own parent", [], 422);
      const parent = await prisma.category.findUnique({ where: { id: data.parentId }, select: { id: true } });
      if (!parent) return jsonError("Invalid parent category", [], 422);
      const cycle = await categoryChainContains(prisma, data.parentId, id);
      if (cycle) return jsonError("Invalid parent: would create a cycle", [], 422);
    }

    const patch = {};
    for (const k of ["name", "slug", "parentId", "image", "description", "isActive", "sortOrder"]) {
      if (data[k] !== undefined) patch[k] = data[k];
    }

    const updated = await prisma.category.update({
      where: { id },
      data: patch,
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        isActive: true,
        sortOrder: true,
      },
    });

    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const id = params.id;
    if (!id) return jsonError("Missing id", [], 400);

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { children: true } } },
    });
    if (!existing) return jsonError("Not found", [], 404);

    if (existing._count.children > 0) {
      return jsonError("Move or delete child categories first", [], 409);
    }

    await prisma.category.update({
      where: { id },
      data: { isActive: false },
      select: { id: true },
    });

    return jsonSuccess({ id, deactivated: true });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
