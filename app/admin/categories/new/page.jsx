import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";
import { buildCategoryParentOptions } from "@/lib/catalog-helpers";

export const dynamic = "force-dynamic";

export const metadata = { title: "New category" };

export default async function AdminNewCategoryPage() {
  await auth();
  const flat = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true, sortOrder: true },
  });
  const parentOptions = buildCategoryParentOptions(flat, undefined);

  const initialValues = {
    name: "",
    slug: "",
    parentId: "",
    image: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New category</h1>
        <p className="text-sm text-muted-foreground">Create a category or subcategory.</p>
      </div>
      <CategoryForm mode="create" listHref="/admin/categories" parentOptions={parentOptions} initialValues={initialValues} />
    </div>
  );
}
