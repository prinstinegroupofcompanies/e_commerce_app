import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "SEO settings" };

export default function AdminSeoSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO settings</h1>
        <p className="text-sm text-muted-foreground">Defaults applied to all storefront pages.</p>
      </div>
      <SettingsForm
        group="seo"
        title="Search engine"
        fields={[
          { key: "meta_title", label: "Default meta title", default: "Markay Hall — Multivendor marketplace" },
          { key: "meta_description", label: "Default meta description", type: "textarea" },
          { key: "meta_keywords", label: "Keywords (comma separated)" },
          { key: "og_image", label: "Open Graph image URL", type: "url" },
          { key: "google_analytics_id", label: "Google Analytics ID" },
        ]}
      />
    </div>
  );
}
