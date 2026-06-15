import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { SimpleToggleButton } from "@/components/admin/simple-toggle-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog posts" };

export default async function AdminBlogPostsPage() {
  await auth();
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog posts</h1>
          <p className="text-sm text-muted-foreground">Manage articles published on the storefront.</p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/blog/posts"
          triggerLabel="New post"
          fields={[
            { key: "title", label: "Title", required: true },
            { key: "slug", label: "Slug", placeholder: "auto", omitIfEmpty: true },
            { key: "excerpt", label: "Excerpt", emptyAsNull: true },
          ]}
          payloadDefaults={{ isPublished: false }}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No posts yet.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">/blog/{p.slug}</p>
                  </TableCell>
                  <TableCell>{p.category?.name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
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
                      endpoint={`/api/admin/blog/posts/${p.id}`}
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
