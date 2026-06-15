import { AdminSellersList } from "@/components/admin/admin-sellers-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sellers" };

export default function AdminSellersPage() {
  return <AdminSellersList />;
}
