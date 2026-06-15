import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  label: z.string().max(50).default("Home"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional().nullable(),
  country: z.string().min(1),
  zipCode: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;

  const addresses = await prisma.address.findMany({
    where: { customerId: gate.session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return jsonSuccess(addresses);
}

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["customer"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const customerId = gate.session.user.id;
    const data = parsed.data;

    const created = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      const count = await tx.address.count({ where: { customerId } });
      const isDefault = data.isDefault ?? count === 0;

      return tx.address.create({
        data: {
          customerId,
          label: data.label,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state ?? null,
          country: data.country,
          zipCode: data.zipCode ?? null,
          isDefault,
        },
      });
    });

    return jsonSuccess(created, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
