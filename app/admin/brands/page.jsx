import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminCatalogDeactivateButton } from "@/components/admin/admin-catalog-deactivate-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  await auth();
  const rows = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground">Manage brand logos and visibility.</p>
        </div>
        <Button asChild>
          <Link href="/admin/brands/new">Add brand</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No brands yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo}
                        alt=""
                        className="h-10 w-10 rounded-md object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/brands/${b.id}/edit`} className="text-primary hover:underline">
                      {b.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{b.slug}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{b._count.products}</TableCell>
                  <TableCell>
                    {b.isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/brands/${b.id}/edit`}>Edit</Link>
                      </Button>
                      {b.isActive ? <AdminCatalogDeactivateButton apiPath={`/api/brands/${b.id}`} /> : null}
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
