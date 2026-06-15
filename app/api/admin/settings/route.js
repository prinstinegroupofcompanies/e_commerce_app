import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  group: z.string().min(1).max(50).optional(),
  values: z.record(z.string(), z.string().nullable()),
});

export async function GET(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group") || undefined;
  const settings = await prisma.setting.findMany({
    where: group ? { group } : undefined,
    orderBy: { key: "asc" },
  });
  return jsonSuccess(settings);
}

export async function PUT(request) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const { group = "general", values } = parsed.data;

    await prisma.$transaction(
      Object.entries(values).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: value ?? null, group },
          update: { value: value ?? null, group },
        })
      )
    );

    const fresh = await prisma.setting.findMany({ where: { group } });
    return jsonSuccess(fresh);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
