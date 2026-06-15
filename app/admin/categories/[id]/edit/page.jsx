import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";
import { buildCategoryParentOptions } from "@/lib/catalog-helpers";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit category" };

export default async function AdminEditCategoryPage({ params }) {
  await auth();
  const id = params.id;

  const [cat, flat] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true, sortOrder: true },
    }),
  ]);

  if (!cat) notFound();

  const parentOptions = buildCategoryParentOptions(flat, id);

  const initialValues = {
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId ?? "",
    image: cat.image ?? "",
    description: cat.description ?? "",
    sortOrder: String(cat.sortOrder ?? 0),
    isActive: cat.isActive !== false,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit category</h1>
        <p className="text-sm text-muted-foreground">{cat.name}</p>
      </div>
      <CategoryForm
        mode="edit"
        categoryId={cat.id}
        listHref="/admin/categories"
        parentOptions={parentOptions}
        initialValues={initialValues}
      />
    </div>
  );
}
