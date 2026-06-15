import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  await auth();
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CMS pages</h1>
          <p className="text-sm text-muted-foreground">Standalone pages like About, Terms, Privacy, FAQ.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/pages"
          triggerLabel="New page"
          fields={[
            { key: "title", label: "Title", required: true },
            { key: "slug", label: "Slug", placeholder: "auto", omitIfEmpty: true },
          ]}
          payloadDefaults={{ isPublished: false }}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No pages yet.</TableCell>
              </TableRow>
            ) : (
              pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">/{p.slug}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {p.isPublished ? (
                      <Badge variant="secondary">Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <SimpleToggleButton
                      endpoint={`/api/admin/pages/${p.id}`}
                      field="isPublished"
                      value={p.isPublished}
                      labelOn="Unpublish"
                      labelOff="Publish"
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
