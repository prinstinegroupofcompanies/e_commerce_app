import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { attributeCreateBodySchema } from "@/lib/validators/attribute";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = attributeCreateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const { name, values } = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      const attr = await tx.attribute.create({
        data: { name },
        select: { id: true, name: true, createdAt: true },
      });
      if (values.length > 0) {
        await tx.attributeValue.createMany({
          data: values.map((value) => ({ attributeId: attr.id, value })),
        });
      }
      const full = await tx.attribute.findUnique({
        where: { id: attr.id },
        include: { values: { orderBy: { value: "asc" } } },
      });
      return full;
    });

    return jsonSuccess(created, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
