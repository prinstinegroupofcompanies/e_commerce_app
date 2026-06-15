import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog tags" };

export default async function AdminBlogTagsPage() {
  await auth();
  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog tags</h1>
          <p className="text-sm text-muted-foreground">Keywords assigned to posts.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/blog/tags"
          triggerLabel="New tag"
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "slug", label: "Slug", placeholder: "auto" },
          ]}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Posts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No tags yet.
                </TableCell>
              </TableRow>
            ) : (
              tags.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.slug}</TableCell>
                  <TableCell className="text-right tabular-nums">{t._count.posts}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
