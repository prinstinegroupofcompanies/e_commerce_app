import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminCatalogDeactivateButton } from "@/components/admin/admin-catalog-deactivate-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await auth();
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      sortOrder: true,
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize catalog hierarchy for ShopLIB.</p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">Add category</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="text-right">Subcategories</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/categories/${c.id}/edit`} className="text-primary hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.slug}</div>
                  </TableCell>
                  <TableCell>{c.parent?.name ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.products}</TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.children}</TableCell>
                  <TableCell>
                    {c.isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/categories/${c.id}/edit`}>Edit</Link>
                      </Button>
                      {c.isActive ? (
                        <AdminCatalogDeactivateButton apiPath={`/api/categories/${c.id}`} />
                      ) : null}
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
