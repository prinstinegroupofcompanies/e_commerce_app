import { CustomerShell } from "@/components/customer/customer-shell";

export const metadata = { title: "My account" };

export default function DashboardLayout({ children }) {
  return <CustomerShell>{children}</CustomerShell>;
}
