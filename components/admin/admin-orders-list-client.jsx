"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ORDER_STATUSES = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const TABS = [
  { href: "/admin/orders", label: "All", id: "all" },
  { href: "/admin/orders/inhouse", label: "In-house", id: "inhouse" },
  { href: "/admin/orders/seller", label: "Seller", id: "seller" },
  { href: "/admin/orders/pickup", label: "Pickup", id: "pickup" },
];

/**
 * @param {{
 *   tab: "all" | "inhouse" | "seller" | "pickup";
 *   title: string;
 *   description: string;
 *   orders: Array<{
 *     id: string;
 *     code: string;
 *     createdAt: string;
 *     customerName: string;
 *     customerEmail: string;
 *     itemCount: number;
 *     total: number;
 *     paymentStatus: string;
 *     orderStatus: string;
 *   }>;
 * }} props
 */
export function AdminOrdersListClient({ tab, title, description, orders }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set());
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q),
    );
  }, [orders, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggle(id, on) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllVisible(on) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const o of filtered) {
        if (on) next.add(o.id);
        else next.delete(o.id);
      }
      return next;
    });
  }

  async function markReadyForPickup() {
    if (selected.size === 0) {
      toast.error("Select at least one order");
      return;
    }
    setWorking(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          orderStatus: "processing",
          comment: "Ready for pickup",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Update failed");
      } else {
        toast.success(`${json.data?.updated || 0} order(s) marked ready for pickup`);
        setSelected(new Set());
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setWorking(false);
  }

  async function runBulk() {
    if (selected.size === 0) {
      toast.error("Select at least one order");
      return;
    }
    if (!orderStatus && !paymentStatus && !comment.trim()) {
      toast.error("Pick a status to change or add a comment");
      return;
    }
    setWorking(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          orderStatus: orderStatus || undefined,
          paymentStatus: paymentStatus || undefined,
          comment: comment.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Bulk update failed");
      } else {
        toast.success(`${json.data?.updated || 0} order(s) updated`);
        setSelected(new Set());
        setOrderStatus("");
        setPaymentStatus("");
        setComment("");
        router.refresh();
      }
    } catch {
      toast.error("Network error");
    }
    setWorking(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/api/admin/orders/export?tab=${tab}`}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              t.id === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
        <input
          type="search"
          placeholder="Search by code, name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Order status…</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Payment status…</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Optional note…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button type="button" size="sm" onClick={runBulk} disabled={working || selected.size === 0}>
            {working ? "Applying…" : "Apply"}
          </Button>
          {tab === "pickup" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={markReadyForPickup}
              disabled={working || selected.size === 0}
            >
              Mark ready for pickup
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all visible"
                  checked={allVisibleSelected}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No orders in this view.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select ${o.code}`}
                      checked={selected.has(o.id)}
                      onChange={(e) => toggle(o.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                      {o.code}
                    </Link>
                    {o.isPickup ? (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        Pickup{o.pickupPointName ? ` · ${o.pickupPointName}` : ""}
                      </Badge>
                    ) : null}
                    <div className="text-xs font-normal text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm">{o.customerName || "—"}</div>
                    <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {o.customerEmail || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{o.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">${o.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {o.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {o.orderStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
