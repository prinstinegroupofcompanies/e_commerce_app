import { SellerShell } from "@/components/seller/seller-shell";

export const metadata = { title: "Seller" };

export default function SellerLayout({ children }) {
  return <SellerShell>{children}</SellerShell>;
}
