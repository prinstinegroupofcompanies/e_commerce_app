import { SellerOrdersList } from "@/components/seller/seller-orders-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

export default function SellerOrdersPage() {
  return <SellerOrdersList />;
}
