import { auth } from "@/lib/auth";
import { ensureHomepageBanners } from "@/lib/homepage-banners";
import { HomepageBannersEditor } from "@/components/admin/homepage-banners-editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Homepage banners" };

export default async function AdminHomepageBannersPage() {
  await auth();
  const banners = await ensureHomepageBanners();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Homepage banners</h1>
        <p className="text-sm text-muted-foreground">
          Manage the three hero images on the storefront homepage. Toggle &quot;Active&quot; to show or hide each banner.
        </p>
      </div>
      <HomepageBannersEditor banners={banners} />
    </div>
  );
}
