import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    image: z.string().min(1).max(2000).optional(),
    link: z.string().max(2000).optional().nullable(),
    position: z.string().max(50).optional(),
    sortOrder: z.coerce.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

export async function PATCH(request, { params }) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const banner = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!banner) return jsonError("Banner not found", [], 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);

  const data = { ...parsed.data };
  if (data.link !== undefined) data.link = data.link?.trim() || null;

  const updated = await prisma.banner.update({
    where: { id: params.id },
    data,
  });

  return jsonSuccess(updated);
}

export async function DELETE(request, { params }) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const banner = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!banner) return jsonError("Banner not found", [], 404);

  await prisma.banner.delete({ where: { id: params.id } });
  return jsonSuccess({ deleted: true });
}
