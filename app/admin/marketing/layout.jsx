import { MarketingTabs } from "@/components/admin/marketing-tabs";

export default function MarketingLayout({ children }) {
  return (
    <div className="space-y-6">
      <MarketingTabs />
      {children}
    </div>
  );
}
