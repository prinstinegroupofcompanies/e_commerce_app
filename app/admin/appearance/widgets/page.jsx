import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InlineCreateForm } from "@/components/admin/inline-create-form";
import { BannerEditorRow } from "@/components/admin/banner-editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Widgets & banners" };

export default async function AdminWidgetsPage() {
  await auth();
  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners &amp; widgets</h1>
          <p className="text-sm text-muted-foreground">
            Manage promotional banners shown on the storefront hero and other positions.
            Click the pencil icon to edit a banner&apos;s title, image, link, or visibility.
          </p>
        </div>
        <InlineCreateForm
          endpoint="/api/admin/banners"
          triggerLabel="New banner"
          fields={[
            { key: "title", label: "Title", required: true },
            { key: "image", label: "Image URL", type: "url", required: true },
            { key: "link", label: "Link", type: "url", emptyAsNull: true },
            { key: "position", label: "Position", defaultValue: "homepage" },
            { key: "sortOrder", label: "Order", type: "number", defaultValue: "0" },
          ]}
          payloadDefaults={{ isActive: true }}
        />
      </div>

      {banners.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No banners yet. Use &quot;New banner&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <BannerEditorRow key={b.id} banner={b} />
          ))}
        </div>
      )}
    </div>
  );
}
