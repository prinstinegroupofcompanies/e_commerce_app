import { AdminOrdersList } from "@/components/admin/admin-orders-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "In-house orders" };

export default function AdminInhouseOrdersPage() {
  return (
    <AdminOrdersList
      tab="inhouse"
      title="In-house orders"
      description="Orders where every line item is fulfilled without a marketplace seller."
    />
  );
}
