import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandForm } from "@/components/admin/brand-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit brand" };

export default async function AdminEditBrandPage({ params }) {
  await auth();
  const id = params.id;

  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) notFound();

  const initialValues = {
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo ?? "",
    isActive: brand.isActive !== false,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit brand</h1>
        <p className="text-sm text-muted-foreground">{brand.name}</p>
      </div>
      <BrandForm mode="edit" brandId={brand.id} listHref="/admin/brands" initialValues={initialValues} />
    </div>
  );
}
