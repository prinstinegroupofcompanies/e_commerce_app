import { auth } from "@/lib/auth";
import { AttributeForm } from "@/components/admin/attribute-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "New attribute" };

export default async function AdminNewAttributePage() {
  await auth();

  const initialValues = {
    name: "",
    valuesText: "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New attribute</h1>
        <p className="text-sm text-muted-foreground">Add values one per line (e.g. Red, Blue, Green).</p>
      </div>
      <AttributeForm mode="create" listHref="/admin/attributes" initialValues={initialValues} />
    </div>
  );
}
