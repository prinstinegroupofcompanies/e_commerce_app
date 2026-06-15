import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Themes" };

export default function AdminThemesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Theme</h1>
        <p className="text-sm text-muted-foreground">
          Markay Hall ships with a single, fully-branded theme (royal blue &amp; gold). Tune the primary palette below to
          match seasonal campaigns.
        </p>
      </div>

      <SettingsForm
        group="theme"
        title="Active theme"
        description="Values are stored in Setting and read at build time. Re-deploy after changing."
        fields={[
          { key: "theme_id", label: "Theme identifier", default: "markay-hall" },
          { key: "primary_color", label: "Primary color (HEX)", default: "#002395" },
          { key: "accent_color", label: "Accent color (HEX)", default: "#FFBF00" },
          { key: "font_family", label: "Font family", default: "Geist, system-ui, sans-serif" },
        ]}
      />
    </div>
  );
}
