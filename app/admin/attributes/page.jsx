import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminHardDeleteButton } from "@/components/admin/admin-hard-delete-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Attributes" };

export default async function AdminAttributesPage() {
  await auth();
  const rows = await prisma.attribute.findMany({
    orderBy: { name: "asc" },
    include: {
      values: { orderBy: { value: "asc" }, select: { id: true, value: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attributes</h1>
          <p className="text-sm text-muted-foreground">Define option sets for variable products (Color, Size, …).</p>
        </div>
        <Button asChild>
          <Link href="/admin/attributes/new">Add attribute</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Values</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No attributes yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/attributes/${a.id}/edit`} className="text-primary hover:underline">
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-md flex-wrap gap-1">
                      {a.values.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No values</span>
                      ) : (
                        a.values.map((v) => (
                          <Badge key={v.id} variant="outline" className="font-normal">
                            {v.value}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/attributes/${a.id}/edit`}>Edit</Link>
                      </Button>
                      <AdminHardDeleteButton apiPath={`/api/attributes/${a.id}`} />
                    </div>
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
