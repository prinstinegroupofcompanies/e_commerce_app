import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  isActive: z.boolean().default(false),
  isSandbox: z.boolean().default(true),
});

export async function POST(request) {
  try {
    const gate = await requireSessionRoles(["admin"]);
    if (!gate.ok) return gate.response;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    const created = await prisma.paymentMethod.create({ data: parsed.data });
    return jsonSuccess(created, {}, 201);
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
