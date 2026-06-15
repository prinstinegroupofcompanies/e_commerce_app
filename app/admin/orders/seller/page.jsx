import { AdminOrdersList } from "@/components/admin/admin-orders-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Seller orders" };

export default function AdminSellerOrdersPage() {
  return (
    <AdminOrdersList
      tab="seller"
      title="Seller orders"
      description="Orders that include at least one seller line item."
    />
  );
}
