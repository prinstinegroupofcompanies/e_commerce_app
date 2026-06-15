import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "General settings" };

export default function AdminGeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General settings</h1>
        <p className="text-sm text-muted-foreground">Site branding and basic configuration.</p>
      </div>
      <SettingsForm
        group="general"
        title="Site"
        fields={[
          { key: "site_name", label: "Site name", default: "Markay Hall" },
          { key: "site_tagline", label: "Tagline" },
          { key: "site_email", label: "Contact email", type: "email" },
          { key: "site_phone", label: "Contact phone" },
          { key: "site_address", label: "Business address", type: "textarea" },
          { key: "site_logo", label: "Logo URL", type: "url", default: "/markay_hall.jpeg" },
        ]}
      />
    </div>
  );
}
