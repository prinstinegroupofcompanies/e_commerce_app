import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Backup" };

export default async function AdminBackupPage() {
  await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Backup &amp; export</h1>
        <p className="text-sm text-muted-foreground">
          Download a JSON snapshot of all core tables (catalog, orders, sellers, settings…). Use{" "}
          <code className="font-mono">prisma migrate</code> + the dump for proper restores.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Full data export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            This export includes products, orders, customers, sellers, settings, blog, and shipping/payment configuration.
            Sensitive password hashes are included — store securely.
          </p>
          <Button asChild>
            <a href="/api/admin/backup">Download backup (JSON)</a>
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Database commands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>For server-side dumps run from your host:</p>
          <pre className="rounded-md bg-muted p-3 font-mono text-xs">
{`pg_dump $DATABASE_URL > markay-hall-$(date +%F).sql
psql $DATABASE_URL < markay-hall-2026-05-19.sql`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
