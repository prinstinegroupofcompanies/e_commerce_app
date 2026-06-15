import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminProductsList } from "@/components/admin/admin-products-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await auth();
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stockQuantity: true,
      isActive: true,
      isFeatured: true,
      seller: { select: { shopName: true } },
    },
  });

  return <AdminProductsList products={products} />;
}
