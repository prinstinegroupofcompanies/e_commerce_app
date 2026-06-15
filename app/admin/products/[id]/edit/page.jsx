import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductEditorForm } from "@/components/product/product-editor-form";
import { defaultProductFormValues } from "@/lib/product-form-defaults";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product" };

export default async function AdminEditProductPage({ params }) {
  await auth();
  const id = params.id;

  const [product, categories, brands, sellers] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { id: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.seller.findMany({
      where: { isActive: true },
      orderBy: { shopName: "asc" },
      select: { id: true, shopName: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit product</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductEditorForm
        mode="edit"
        productId={product.id}
        isAdmin
        listHref="/admin/products"
        categories={categories}
        brands={brands}
        sellers={sellers}
        initialValues={defaultProductFormValues(product, product.variants)}
      />
    </div>
  );
}
