import { AdminAdvertisementsClient } from "@/components/admin/admin-advertisements-client";

export const dynamic = "force-dynamic";

export default function AdminAdvertisementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store advertisements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review, approve, and activate paid seller placements.</p>
      </div>
      <AdminAdvertisementsClient />
    </div>
  );
}
