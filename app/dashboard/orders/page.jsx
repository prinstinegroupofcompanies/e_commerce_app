import { CustomerOrdersList } from "@/components/customer/customer-orders-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "My orders" };

export default function CustomerOrdersPage() {
  return <CustomerOrdersList />;
}
