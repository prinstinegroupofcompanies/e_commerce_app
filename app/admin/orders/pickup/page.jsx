import { AdminOrdersList } from "@/components/admin/admin-orders-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pickup orders" };

export default function AdminPickupOrdersPage() {
  return (
    <AdminOrdersList tab="pickup" title="Pickup orders" description="Orders marked for pickup at a pickup point." />
  );
}
