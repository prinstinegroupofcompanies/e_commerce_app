import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "E-commerce settings" };

export default function AdminEcommerceSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">E-commerce settings</h1>
        <p className="text-sm text-muted-foreground">Storefront, checkout and order behaviour.</p>
      </div>
      <SettingsForm
        group="ecommerce"
        title="Storefront"
        fields={[
          { key: "free_shipping_threshold", label: "Free shipping threshold ($)", type: "number", default: "50" },
          { key: "default_shipping_cost", label: "Default shipping cost ($)", type: "number", default: "5.99" },
          { key: "default_currency", label: "Default currency", default: "USD" },
          { key: "tax_inclusive_prices", label: "Prices are tax-inclusive", type: "checkbox" },
          { key: "guest_checkout_enabled", label: "Allow guest checkout", type: "checkbox", default: "true" },
          { key: "low_stock_threshold", label: "Low-stock alert threshold", type: "number", default: "5" },
        ]}
      />
    </div>
  );
}
