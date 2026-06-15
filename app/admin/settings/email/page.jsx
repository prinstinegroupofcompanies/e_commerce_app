import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Email settings" };

export default function AdminEmailSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email settings</h1>
        <p className="text-sm text-muted-foreground">Transactional email (SMTP) configuration.</p>
      </div>
      <SettingsForm
        group="email"
        title="SMTP"
        description="These mirror the SMTP_* environment variables used by lib/email.js. Edit the .env file for real production values."
        fields={[
          { key: "smtp_host", label: "SMTP host" },
          { key: "smtp_port", label: "SMTP port", type: "number", default: "587" },
          { key: "smtp_user", label: "SMTP user" },
          { key: "smtp_from", label: "From address", default: "Markay Hall <noreply@localhost>" },
        ]}
      />
    </div>
  );
}
