import { requireSessionRoles } from "@/lib/api-auth";
import { parseAnalyticsRange } from "@/lib/chat/analytics-range";
import { getEventsForExport } from "@/lib/chat/analytics-admin";
import { buildAnalyticsCsv } from "@/lib/chat/analytics-csv";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const gate = await requireSessionRoles(["admin"]);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const { days, since, until } = parseAnalyticsRange({ days: searchParams.get("days") ?? undefined });
  const type = searchParams.get("type") || "events";

  if (type === "summary") {
    const { getAdminAnalyticsSummary } = await import("@/lib/chat/analytics-admin");
    const { buildSummaryCsv } = await import("@/lib/chat/analytics-csv");
    const summary = await getAdminAnalyticsSummary({ days, since, until });
    const csv = buildSummaryCsv(summary);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shop-analytics-summary-${days}d.csv"`,
      },
    });
  }

  const rows = await getEventsForExport({ since, until });
  const csv = buildAnalyticsCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shop-analytics-events-${days}d.csv"`,
    },
  });
}
