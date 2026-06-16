import { CustomerShell } from "@/components/customer/customer-shell";
import { createSectionMetadata } from "@/lib/site-metadata";

export const metadata = createSectionMetadata("My account", "Your Markay Hall customer account");

export default function DashboardLayout({ children }) {
  return <CustomerShell>{children}</CustomerShell>;
}
