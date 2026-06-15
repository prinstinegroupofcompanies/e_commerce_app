import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 120;

export async function generateMetadata({ params }) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, excerpt: true, metaTitle: true, metaDesc: true, thumbnail: true },
  });
  if (!post) return { title: "Not found" };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDesc || post.excerpt || `${SITE_NAME} blog article.`,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDesc || post.excerpt || undefined,
      images: post.thumbnail ? [post.thumbnail] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, isPublished: true },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });
  if (!post) notFound();

  const related = post.categoryId
    ? await prisma.blogPost.findMany({
        where: {
          isPublished: true,
          id: { not: post.id },
          categoryId: post.categoryId,
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true },
      })
    : [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-primary">Blog</Link>
        {post.category ? (
          <>
            <span className="mx-2">/</span>
            <Link href={`/blog?category=${post.category.slug}`} className="hover:text-primary">
              {post.category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <header className="space-y-3">
        {post.category ? (
          <p className="text-xs uppercase tracking-widest text-accent">{post.category.name}</p>
        ) : null}
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" })
            : null}
        </p>
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link key={t.slug} href={`/blog?tag=${t.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  #{t.name}
                </Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {post.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnail}
          alt={post.title}
          className="mt-8 w-full rounded-lg object-cover"
        />
      ) : null}

      {post.excerpt ? (
        <p className="mt-8 text-lg text-muted-foreground">{post.excerpt}</p>
      ) : null}

      <div
        className="prose prose-neutral mt-8 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.content || "<p></p>" }}
      />

      {related.length > 0 ? (
        <section className="mt-16 border-t pt-10">
          <h2 className="text-xl font-semibold">Related posts</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Card key={r.id}>
                <CardContent className="space-y-2 p-4">
                  <Link href={`/blog/${r.slug}`}>
                    <p className="font-medium leading-tight hover:text-primary">{r.title}</p>
                  </Link>
                  {r.excerpt ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{r.excerpt}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
