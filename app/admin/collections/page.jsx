import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  await auth();
  const collections = await prisma.collection.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">Curated groups of products surfaced on the storefront.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/collections"
          triggerLabel="New collection"
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "slug", label: "Slug", placeholder: "auto", omitIfEmpty: true },
            { key: "image", label: "Cover URL", type: "url", emptyAsNull: true },
            { key: "description", label: "Description", emptyAsNull: true },
          ]}
          payloadDefaults={{ isActive: true }}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No collections yet.</TableCell>
              </TableRow>
            ) : (
              collections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.products}</TableCell>
                  <TableCell>
                    {c.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <SimpleToggleButton
                      endpoint={`/api/admin/collections/${c.id}`}
                      field="isActive"
                      value={c.isActive}
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
