import { auth } from "@/lib/auth";
import { BrandForm } from "@/components/admin/brand-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "New brand" };

export default async function AdminNewBrandPage() {
  await auth();

  const initialValues = {
    name: "",
    slug: "",
    logo: "",
    isActive: true,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New brand</h1>
        <p className="text-sm text-muted-foreground">Add a manufacturer or label.</p>
      </div>
      <BrandForm mode="create" listHref="/admin/brands" initialValues={initialValues} />
    </div>
  );
}
