import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * @param {{ hasSmtp: boolean; hasCron: boolean }} props
 */
export function AnalyticsCronHint({ hasSmtp, hasCron }) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Scheduled email report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Send a weekly analytics digest to <code className="text-xs">ANALYTICS_REPORT_EMAIL</code> (or the first
          active admin). Requires SMTP and <code className="text-xs">CRON_SECRET</code>.
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            SMTP:{" "}
            <span className={hasSmtp ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}>
              {hasSmtp ? "configured" : "not configured"}
            </span>
          </li>
          <li>
            Cron secret:{" "}
            <span className={hasCron ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}>
              {hasCron ? "configured" : "not configured"}
            </span>
          </li>
        </ul>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
          {`# Example: every Monday 8am (crontab)
0 8 * * 1 curl -s -H "Authorization: Bearer $CRON_SECRET" \\
  "${base}/api/cron/analytics-report?days=7"`}
        </pre>
        <p className="text-xs">
          Test manually: <code>GET /api/cron/analytics-report?secret=YOUR_CRON_SECRET&amp;days=7</code>
        </p>
      </CardContent>
    </Card>
  );
}
