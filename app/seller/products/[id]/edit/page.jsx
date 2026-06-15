import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductEditorForm } from "@/components/product/product-editor-form";
import { defaultProductFormValues } from "@/lib/product-form-defaults";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product" };

export default async function SellerEditProductPage({ params }) {
  const session = await auth();
  const sellerId = session?.user?.id;
  if (!sellerId) redirect("/seller/login");

  const id = params.id;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findFirst({
      where: { id, sellerId },
      include: { variants: { orderBy: { id: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
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
        isAdmin={false}
        listHref="/seller/products"
        categories={categories}
        brands={brands}
        initialValues={defaultProductFormValues(product, product.variants)}
      />
    </div>
  );
}
