import { BlogTabs } from "@/components/admin/blog-tabs";

export default function BlogLayout({ children }) {
  return (
    <div className="space-y-6">
      <BlogTabs />
      {children}
    </div>
  );
}
