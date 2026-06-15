"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";

export function CustomerWishlistView() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/customer/wishlist");
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(productId) {
    const res = await fetch(`/api/customer/wishlist?productId=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error || "Could not remove");
      return;
    }
    toast.success("Removed from wishlist");
    router.refresh();
    await load();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading wishlist…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground">Your wishlist is empty.</p>
        <Button asChild className="mt-4">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <ProductCard product={item.product} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-2 top-2 bg-background/90"
            onClick={() => remove(item.productId)}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
