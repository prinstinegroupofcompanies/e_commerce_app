import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { attributeUpdateBodySchema } from "@/lib/validators/attribute";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const id = params.id;
    if (!id) return jsonError("Missing id", [], 400);

    const row = await prisma.attribute.findUnique({
      where: { id },
      include: { values: { orderBy: { value: "asc" } } },
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

    const existing = await prisma.attribute.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return jsonError("Not found", [], 404);

    const body = await request.json();
    const parsed = attributeUpdateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const data = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const patch = {};
      if (data.name !== undefined) patch.name = data.name;
      if (Object.keys(patch).length) {
        await tx.attribute.update({ where: { id }, data: patch });
      }
      if (data.values !== undefined) {
        await tx.attributeValue.deleteMany({ where: { attributeId: id } });
        if (data.values.length > 0) {
          await tx.attributeValue.createMany({
            data: data.values.map((value) => ({ attributeId: id, value })),
          });
        }
      }
      return tx.attribute.findUnique({
        where: { id },
        include: { values: { orderBy: { value: "asc" } } },
      });
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

    const existing = await prisma.attribute.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return jsonError("Not found", [], 404);

    await prisma.attribute.delete({ where: { id } });

    return jsonSuccess({ id, deleted: true });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
