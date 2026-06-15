"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const POLL_MS = 60_000;

function formatRelative(iso) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items || []);
        setUnread(json.data.unread || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function markOne(id) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-card text-primary hover:bg-primary/5"
        onClick={() => {
          if (!open) load();
          setOpen((o) => !o);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-md border border-primary/10 bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-primary/10 px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={markAllRead}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</li>
            ) : items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</li>
            ) : (
              items.map((n) => {
                const inner = (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm font-medium leading-tight">{n.title}</p>
                      {!n.isRead ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden /> : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                );
                return (
                  <li key={n.id} className={`border-b border-primary/5 ${n.isRead ? "bg-card" : "bg-primary/[0.03]"}`}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        className="block px-3 py-2 hover:bg-muted/60"
                        onClick={() => {
                          if (!n.isRead) markOne(n.id);
                          setOpen(false);
                        }}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-muted/60"
                        onClick={() => !n.isRead && markOne(n.id)}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
