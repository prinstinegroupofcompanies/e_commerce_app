"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushNotificationsToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        Boolean(vapidKey),
    );
  }, [vapidKey]);

  async function subscribe() {
    if (!vapidKey) {
      toast.error("Push notifications are not configured on this server");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Notification permission denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/customer/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Could not save subscription");
        return;
      }
      setEnabled(true);
      toast.success("Push notifications enabled");
    } catch (e) {
      console.error(e);
      toast.error("Could not enable push notifications");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/customer/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      toast.success("Push notifications disabled");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Browser push is unavailable. Configure VAPID keys or use a supported browser.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted-foreground">Get order and delivery updates in your browser.</p>
      {enabled ? (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={unsubscribe}>
          Disable push
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={busy} onClick={subscribe}>
          Enable push
        </Button>
      )}
    </div>
  );
}
