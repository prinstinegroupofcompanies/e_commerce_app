import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional().nullable(),
  avatar: z.string().max(1000).optional().nullable(),
});

export async function GET() {
  const gate = await requireSessionRoles(["customer"]);
  if (!gate.ok) return gate.response;

  const customer = await prisma.customer.findUnique({
    where: { id: gate.session.user.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true, walletBalance: true },
  });

  if (!customer) return jsonError("Not found", [], 404);
  return jsonSuccess(customer);
}

export async function PATCH(request) {
  try {
    const gate = await requireSessionRoles(["customer"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const updated = await prisma.customer.update({
      where: { id: gate.session.user.id },
      data: {
        ...(parsed.data.name != null ? { name: parsed.data.name } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.avatar !== undefined ? { avatar: parsed.data.avatar } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, avatar: true },
    });

    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
