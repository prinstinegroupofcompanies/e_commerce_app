import { SellerShell } from "@/components/seller/seller-shell";
import { createSectionMetadata } from "@/lib/site-metadata";

export const metadata = createSectionMetadata("Seller", "Markay Hall seller portal");

export default function SellerLayout({ children }) {
  return <SellerShell>{children}</SellerShell>;
}
