import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BlogPostEditor } from "@/components/admin/blog-post-editor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: post ? `Edit: ${post.title}` : "Edit post" };
}

export default async function EditBlogPostPage({ params }) {
  await auth();
  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id: params.id } }),
    prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit post</h1>
        <p className="text-sm text-muted-foreground">{post.title}</p>
      </div>
      <BlogPostEditor mode="edit" post={post} categories={categories} />
    </div>
  );
}
