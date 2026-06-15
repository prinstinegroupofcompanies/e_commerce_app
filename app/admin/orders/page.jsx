import { AdminOrdersList } from "@/components/admin/admin-orders-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <AdminOrdersList tab="all" title="Orders" description="Review and update customer orders across the marketplace." />
  );
}
