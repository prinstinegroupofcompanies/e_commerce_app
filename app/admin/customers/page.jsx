import { AdminCustomersList } from "@/components/admin/admin-customers-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return <AdminCustomersList />;
}
