import { prisma } from "@/lib/prisma";
import { requireSessionRoles } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const subs = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = "email,isActive,createdAt\n";
  const rows = subs
    .map((s) => `${s.email},${s.isActive ? "true" : "false"},${s.createdAt.toISOString()}`)
    .join("\n");

  const csv = header + rows + (rows.length ? "\n" : "");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
