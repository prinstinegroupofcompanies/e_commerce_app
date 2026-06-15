import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Users, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Newsletter subscribers" };

export default async function AdminNewsletterSubscribersPage() {
  const [subs, totals] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.newsletterSubscriber.groupBy({
      by: ["isActive"],
      _count: { _all: true },
    }),
  ]);

  const active = totals.find((t) => t.isActive)?._count?._all || 0;
  const inactive = totals.find((t) => !t.isActive)?._count?._all || 0;
  const total = active + inactive;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Newsletter subscribers</h1>
          <p className="text-sm text-muted-foreground">
            Manage email subscribers, deactivate addresses, or export the full list as CSV.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/api/admin/newsletter/export">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Link>
          </Button>
          <InlineCreateForm
            endpoint="/api/admin/newsletter"
            triggerLabel="Add subscriber"
            fields={[{ key: "email", label: "Email", type: "email", required: true }]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={total} icon={Users} />
        <StatCard label="Active" value={active} icon={Mail} />
        <StatCard label="Inactive" value={inactive} icon={Mail} muted />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No subscribers yet.
                </TableCell>
              </TableRow>
            ) : (
              subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {s.isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <SimpleToggleButton
                      endpoint={`/api/admin/newsletter/${s.id}`}
                      field="isActive"
                      value={s.isActive}
                      labelOn="Deactivate"
                      labelOff="Activate"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, muted }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md ${
            muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
