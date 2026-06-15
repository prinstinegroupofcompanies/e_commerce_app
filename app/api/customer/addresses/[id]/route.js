import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().optional().nullable(),
  country: z.string().min(1).optional(),
  zipCode: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(request, context) {
  try {
    const gate = await requireSessionRoles(["customer"]);
    if (!gate.ok) return gate.response;

    const { id } = context.params;
    const customerId = gate.session.user.id;

    const existing = await prisma.address.findFirst({ where: { id, customerId } });
    if (!existing) return jsonError("Address not found", [], 404);

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const data = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...(data.label != null ? { label: data.label } : {}),
          ...(data.firstName != null ? { firstName: data.firstName } : {}),
          ...(data.lastName != null ? { lastName: data.lastName } : {}),
          ...(data.phone != null ? { phone: data.phone } : {}),
          ...(data.address != null ? { address: data.address } : {}),
          ...(data.city != null ? { city: data.city } : {}),
          ...(data.state !== undefined ? { state: data.state } : {}),
          ...(data.country != null ? { country: data.country } : {}),
          ...(data.zipCode !== undefined ? { zipCode: data.zipCode } : {}),
          ...(data.isDefault != null ? { isDefault: data.isDefault } : {}),
        },
      });
    });

    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}

export async function DELETE(_request, context) {
  try {
    const gate = await requireSessionRoles(["customer"]);
    if (!gate.ok) return gate.response;

    const { id } = context.params;
    const customerId = gate.session.user.id;

    const existing = await prisma.address.findFirst({ where: { id, customerId } });
    if (!existing) return jsonError("Address not found", [], 404);

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where: { customerId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }

    return jsonSuccess({ deleted: true });
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
