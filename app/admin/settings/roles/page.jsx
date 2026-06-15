import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Roles" };

export default async function AdminRolesPage() {
  await auth();
  const admins = await prisma.admin.findMany({ orderBy: { createdAt: "asc" } });

  const grouped = admins.reduce((acc, a) => {
    acc[a.role] ||= [];
    acc[a.role].push(a);
    return acc;
  }, /** @type {Record<string, typeof admins>} */ ({}));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles &amp; admins</h1>
        <p className="text-sm text-muted-foreground">
          Admin accounts are grouped by role. To add an admin, run <code className="font-mono">npm run seed:admin</code>
          {" "}or create directly in Prisma Studio.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No admins yet.</TableCell>
              </TableRow>
            ) : (
              admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{a.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {a.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Disabled</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(grouped).map(([role, list]) => (
          <div key={role} className="rounded-md border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
            <p className="mt-1 text-lg font-semibold capitalize">{role}</p>
            <p className="text-sm text-muted-foreground">{list.length} admin(s)</p>
          </div>
        ))}
      </div>
    </div>
  );
}
