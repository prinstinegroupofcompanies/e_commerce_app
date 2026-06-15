import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CustomerSettingsForm } from "@/components/customer/customer-settings-form";
import { PushNotificationsToggle } from "@/components/customer/push-notifications-toggle";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account settings" };

export default async function CustomerSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your profile information.</p>
      </div>
      <div className="rounded-lg border p-5">
        <h2 className="text-base font-semibold">Notifications</h2>
        <div className="mt-3">
          <PushNotificationsToggle />
        </div>
      </div>
      <CustomerSettingsForm />
    </div>
  );
}
