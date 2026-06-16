import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/upload-url";

export const revalidate = 120;

export const metadata = {
  title: "Blog",
  description: `News, guides, and updates from ${SITE_NAME}.`,
};

export default async function BlogIndexPage({ searchParams }) {
  const category = searchParams?.category?.toString().toLowerCase() || null;
  const tag = searchParams?.tag?.toString().toLowerCase() || null;

  const where = {
    isPublished: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(tag ? { tags: { some: { slug: tag } } } : {}),
  };

  const [posts, categories, tags] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 30,
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
      },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: { where: { isPublished: true } } } } },
    }),
    prisma.blogTag.findMany({ orderBy: { name: "asc" }, take: 20 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-accent">Journal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">The {SITE_NAME} blog</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Buying guides, marketplace news, and stories from independent sellers.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr,260px]">
        <div>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No posts published yet. Check back soon.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-6">
              {posts.map((post) => (
                <li key={post.id}>
                  <Card className="overflow-hidden">
                    {post.thumbnail ? (
                      <Link href={`/blog/${post.slug}`} className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveMediaUrl(post.thumbnail)}
                          alt={post.title}
                          className="h-48 w-full object-cover"
                        />
                      </Link>
                    ) : null}
                    <CardContent className="space-y-2 p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {post.category?.slug ? (
                          <Link
                            href={`/blog?category=${post.category.slug}`}
                            className="text-accent hover:underline"
                          >
                            {post.category.name}
                          </Link>
                        ) : null}
                        {post.publishedAt ? (
                          <>
                            {post.category ? <span aria-hidden>·</span> : null}
                            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                          </>
                        ) : null}
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-2xl font-semibold leading-tight hover:text-primary">
                          {post.title}
                        </h2>
                      </Link>
                      {post.excerpt ? (
                        <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                      ) : null}
                      {post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.tags.map((t) => (
                            <Link key={t.slug} href={`/blog?tag=${t.slug}`}>
                              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                                #{t.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-6">
          {categories.length > 0 ? (
            <div className="rounded-lg border border-primary/10 bg-card p-4">
              <p className="text-sm font-semibold text-primary">Categories</p>
              <ul className="mt-3 space-y-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/blog?category=${c.slug}`}
                      className={`flex items-center justify-between text-sm hover:text-primary ${
                        category === c.slug ? "font-semibold text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="tabular-nums text-xs">{c._count.posts}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className="rounded-lg border border-primary/10 bg-card p-4">
              <p className="text-sm font-semibold text-primary">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link key={t.id} href={`/blog?tag=${t.slug}`}>
                    <Badge
                      variant={tag === t.slug ? "secondary" : "outline"}
                      className="cursor-pointer"
                    >
                      #{t.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
