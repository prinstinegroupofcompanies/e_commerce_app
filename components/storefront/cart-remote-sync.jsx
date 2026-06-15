"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { mergeLoginCart, useCartStore } from "@/store/cart-store";

export function CartRemoteSync() {
  const { data: session, status } = useSession();
  const [hydrated, setHydrated] = useState(false);
  /** Customer id once initial GET → merge → POST has finished for that session */
  const mergeCompleteFor = useRef(/** @type {string | null} */ (null));
  const postTimer = useRef(/** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined));

  useEffect(() => {
    const p = useCartStore.persist;
    if (!p) {
      setHydrated(true);
      return undefined;
    }
    if (typeof p.hasHydrated === "function" && p.hasHydrated()) {
      setHydrated(true);
    }
    return p.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      mergeCompleteFor.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (!hydrated || status !== "authenticated") return;
    if (session?.user?.role !== "customer" || !session.user.id) return;

    const customerId = session.user.id;
    if (mergeCompleteFor.current === customerId) return;

    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store", signal: ac.signal });
        const json = await res.json();
        if (!json.success || ac.signal.aborted) return;

        const remote = json.data.items || [];
        const local = useCartStore.getState().items;
        const nextItems = mergeLoginCart(remote, local);
        const couponCode = json.data.coupon || null;

        useCartStore.setState({ items: nextItems, coupon: couponCode, couponMeta: null });

        if (couponCode) {
          const applied = await useCartStore.getState().applyCoupon(couponCode);
          if (!applied.ok) {
            useCartStore.setState({ coupon: null, couponMeta: null });
          }
        }

        const st = useCartStore.getState();
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: st.items, coupon: st.coupon }),
          signal: ac.signal,
        });

        if (!ac.signal.aborted) {
          mergeCompleteFor.current = customerId;
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error(e);
      }
    })();

    return () => ac.abort();
  }, [hydrated, status, session?.user?.id, session?.user?.role]);

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);

  useEffect(() => {
    if (!hydrated || status !== "authenticated" || session?.user?.role !== "customer") return;
    if (!session.user.id || mergeCompleteFor.current !== session.user.id) return;

    clearTimeout(postTimer.current);
    postTimer.current = setTimeout(async () => {
      try {
        const st = useCartStore.getState();
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: st.items, coupon: st.coupon }),
        });
      } catch {
        /* noop */
      }
    }, 900);

    return () => clearTimeout(postTimer.current);
  }, [items, coupon, hydrated, status, session?.user?.role, session?.user?.id]);

  return null;
}
