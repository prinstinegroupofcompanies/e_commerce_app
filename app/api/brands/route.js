import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";
import { brandCreateBodySchema } from "@/lib/validators/brand";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = brandCreateBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }
    const data = parsed.data;

    const dup = await prisma.brand.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (dup) return jsonError("Slug already in use", [], 409);

    const created = await prisma.brand.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo ?? null,
        isActive: data.isActive,
      },
      select: { id: true, name: true, slug: true, logo: true, isActive: true },
    });

    return jsonSuccess(created, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
