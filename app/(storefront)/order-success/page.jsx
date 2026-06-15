import { OrderSuccessClient } from "@/components/storefront/order-success-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order placed" };

export default function OrderSuccessPage() {
  return <OrderSuccessClient />;
}
