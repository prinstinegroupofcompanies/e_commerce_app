import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Seller settings" };

export default function AdminSellerSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seller settings</h1>
        <p className="text-sm text-muted-foreground">Marketplace policies that apply to all sellers.</p>
      </div>
      <SettingsForm
        group="seller"
        title="Seller program"
        fields={[
          { key: "default_commission_rate", label: "Default commission rate (%)", type: "number", default: "10" },
          { key: "require_seller_approval", label: "New sellers require admin approval", type: "checkbox", default: "true" },
          { key: "min_payout_amount", label: "Minimum payout amount ($)", type: "number", default: "20" },
          { key: "payout_schedule", label: "Payout schedule", placeholder: "weekly | biweekly | monthly", default: "monthly" },
          { key: "seller_terms", label: "Seller terms", type: "textarea" },
        ]}
      />
    </div>
  );
}
