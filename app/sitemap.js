import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const [products, categories, shops, posts, pages] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 1000,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
      take: 200,
    }),
    prisma.seller.findMany({
      where: { isShopActive: true, shopSlug: { not: null } },
      select: { shopSlug: true, updatedAt: true },
      take: 500,
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      take: 500,
    }),
    prisma.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      take: 200,
    }),
  ]);

  const now = new Date();
  const staticUrls = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  return [
    ...staticUrls,
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    })),
    ...shops.map((s) => ({
      url: `${base}/shop/${s.shopSlug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    })),
    ...pages.map((p) => ({
      url: `${base}/pages/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.4,
    })),
  ];
}
