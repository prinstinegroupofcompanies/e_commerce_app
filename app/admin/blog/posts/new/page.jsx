import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BlogPostEditor } from "@/components/admin/blog-post-editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "New blog post" };

export default async function NewBlogPostPage() {
  await auth();
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New blog post</h1>
        <p className="text-sm text-muted-foreground">Create and publish articles for the storefront blog.</p>
      </div>
      <BlogPostEditor mode="create" categories={categories} />
    </div>
  );
}
