import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductEditorForm } from "@/components/product/product-editor-form";
import { defaultProductFormValues } from "@/lib/product-form-defaults";

export const dynamic = "force-dynamic";

export const metadata = { title: "New product" };

export default async function AdminNewProductPage() {
  await auth();
  const [categories, brands, sellers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.seller.findMany({
      where: { isActive: true },
      orderBy: { shopName: "asc" },
      select: { id: true, shopName: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New product</h1>
        <p className="text-sm text-muted-foreground">Add a catalog item and assign it to a seller.</p>
      </div>
      <ProductEditorForm
        mode="create"
        isAdmin
        listHref="/admin/products"
        categories={categories}
        brands={brands}
        sellers={sellers}
        initialValues={defaultProductFormValues()}
      />
    </div>
  );
}
