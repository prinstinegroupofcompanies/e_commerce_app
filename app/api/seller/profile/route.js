import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().max(50).optional().nullable(),
    avatar: z.string().max(2000).optional().nullable(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).max(200).optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: "Current password required to change password",
    path: ["currentPassword"],
  });

export async function GET() {
  const gate = await requireSessionRoles(["seller"]);
  if (!gate.ok) return gate.response;
  const seller = await prisma.seller.findUnique({
    where: { id: gate.session.user.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true },
  });
  if (!seller) return jsonError("Not found", [], 404);
  return jsonSuccess(seller);
}

export async function PATCH(request) {
  try {
    const gate = await requireSessionRoles(["seller"]);
    if (!gate.ok) return gate.response;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

    /** @type {Record<string, unknown>} */
    const data = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone?.trim() || null;
    if (parsed.data.avatar !== undefined) data.avatar = parsed.data.avatar?.trim() || null;

    if (parsed.data.newPassword) {
      const seller = await prisma.seller.findUnique({
        where: { id: gate.session.user.id },
        select: { password: true },
      });
      if (!seller) return jsonError("Not found", [], 404);
      const ok = await bcrypt.compare(parsed.data.currentPassword || "", seller.password);
      if (!ok) return jsonError("Current password is incorrect", [], 401);
      data.password = await bcrypt.hash(parsed.data.newPassword, 10);
    }

    const updated = await prisma.seller.update({
      where: { id: gate.session.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar: true },
    });
    return jsonSuccess(updated);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
