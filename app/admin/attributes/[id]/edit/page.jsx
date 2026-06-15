import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttributeForm } from "@/components/admin/attribute-form";
import { AdminHardDeleteButton } from "@/components/admin/admin-hard-delete-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit attribute" };

export default async function AdminEditAttributePage({ params }) {
  await auth();
  const id = params.id;

  const attr = await prisma.attribute.findUnique({
    where: { id },
    include: { values: { orderBy: { value: "asc" } } },
  });
  if (!attr) notFound();

  const initialValues = {
    name: attr.name,
    valuesText: attr.values.map((v) => v.value).join("\n"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit attribute</h1>
          <p className="text-sm text-muted-foreground">{attr.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/attributes">Back to list</Link>
          </Button>
          <AdminHardDeleteButton apiPath={`/api/attributes/${attr.id}`} />
        </div>
      </div>
      <AttributeForm mode="edit" attributeId={attr.id} listHref="/admin/attributes" initialValues={initialValues} />
    </div>
  );
}
