import { AdminShell } from "@/components/admin/admin-shell";
import { createSectionMetadata } from "@/lib/site-metadata";

export const metadata = createSectionMetadata("Admin", "Markay Hall administration portal");

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
