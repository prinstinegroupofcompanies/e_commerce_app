import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { brandUpdateBodySchema } from "@/lib/validators/brand";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const id = params.id;
    if (!id) return jsonError("Missing id", [], 400);

    const row = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
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

    const existing = await prisma.brand.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return jsonError("Not found", [], 404);

    const body = await request.json();
    const parsed = brandUpdateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const data = parsed.data;

    if (data.slug !== undefined && data.slug !== existing.slug) {
      const dup = await prisma.brand.findUnique({ where: { slug: data.slug }, select: { id: true } });
      if (dup && dup.id !== id) return jsonError("Slug already in use", [], 409);
    }

    const patch = {};
    for (const k of ["name", "slug", "logo", "isActive"]) {
      if (data[k] !== undefined) patch[k] = data[k];
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: patch,
      select: { id: true, name: true, slug: true, logo: true, isActive: true },
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

    const existing = await prisma.brand.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return jsonError("Not found", [], 404);

    await prisma.brand.update({
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
