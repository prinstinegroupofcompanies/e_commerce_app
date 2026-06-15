import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityLogsFilters } from "@/components/admin/activity-logs-filters";

export const dynamic = "force-dynamic";

export const metadata = { title: "Activity logs" };

/** @param {{ searchParams: Record<string, string | string[] | undefined> }} props */
export default async function AdminActivityLogsPage({ searchParams }) {
  await auth();

  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const action = typeof searchParams.action === "string" ? searchParams.action.trim() : "";
  const from = typeof searchParams.from === "string" ? searchParams.from : "";
  const to = typeof searchParams.to === "string" ? searchParams.to : "";

  /** @type {import("@prisma/client").Prisma.ActivityLogWhereInput} */
  const where = {};

  if (action) {
    where.action = { contains: action };
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  if (q) {
    where.OR = [
      { subject: { contains: q } },
      { action: { contains: q } },
      { meta: { contains: q } },
      { admin: { is: { name: { contains: q } } } },
      { admin: { is: { email: { contains: q } } } },
    ];
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity logs</h1>
        <p className="text-sm text-muted-foreground">Most recent admin actions recorded by the system.</p>
      </div>

      <Suspense fallback={null}>
        <ActivityLogsFilters />
      </Suspense>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No activity matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {l.admin ? `${l.admin.name} (${l.admin.email})` : "system"}
                  </TableCell>
                  <TableCell className="font-medium">{l.action}</TableCell>
                  <TableCell className="text-sm">{l.subject}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.ip || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
