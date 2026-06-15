import { SellerSettingsForm } from "@/components/seller/seller-settings-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account settings" };

export default function SellerSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
        <p className="text-sm text-muted-foreground">Manage your seller profile and login credentials.</p>
      </div>
      <SellerSettingsForm />
    </div>
  );
}
