import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/brand";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, metaTitle: true, metaDesc: true },
  });
  if (!page) return { title: "Not found" };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || `${page.title} · ${SITE_NAME}`,
  };
}

export default async function CmsPage({ params }) {
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, isPublished: true },
  });
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="border-b border-primary/10 pb-6">
        <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated {new Date(page.updatedAt).toLocaleDateString()}
        </p>
      </header>
      <div
        className="prose prose-neutral mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content || "<p>This page has no content yet.</p>" }}
      />
    </div>
  );
}
