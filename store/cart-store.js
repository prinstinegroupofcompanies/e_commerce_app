import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * @typedef {{ productId: string, variantId: string | null, name: string, price: number, quantity: number, image?: string | null, sellerId?: string | null }} CartLine
 */

/**
 * @param {CartLine} i
 */
function lineKey(i) {
  return `${i.productId}|${i.variantId ?? ""}`;
}

/**
 * Server cart wins for lines that exist on both sides; local-only lines are kept.
 * @param {CartLine[]} remote
 * @param {CartLine[]} local
 */
export function mergeLoginCart(remote, local) {
  if (!remote.length) return [...local];
  const map = new Map(remote.map((i) => [lineKey(i), { ...i }]));
  for (const i of local) {
    const k = lineKey(i);
    if (!map.has(k)) map.set(k, { ...i });
  }
  return [...map.values()];
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      /** @type {CartLine[]} */
      items: [],
      /** @type {string | null} */
      coupon: null,
      /** @type {{ discount: number; title: string; discountType: string } | null} */
      couponMeta: null,

      /**
       * @param {Omit<CartLine, "quantity"> & { quantity?: number }} payload
       */
      addItem: (payload) => {
        const qty = payload.quantity ?? 1;
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === payload.productId && i.variantId === payload.variantId
          );
          if (idx === -1) {
            return {
              items: [
                ...state.items,
                {
                  productId: payload.productId,
                  variantId: payload.variantId ?? null,
                  name: payload.name,
                  price: payload.price,
                  quantity: qty,
                  image: payload.image,
                  sellerId: payload.sellerId,
                },
              ],
            };
          }
          const next = [...state.items];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return { items: next };
        });
      },
      /**
       * @param {string} productId
       * @param {string | null} variantId
       * @param {number} quantity
       */
      updateQuantity: (productId, variantId, quantity) => {
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
            )
            .filter((i) => i.quantity > 0),
        }));
      },
      /**
       * @param {string} productId
       * @param {string | null} variantId
       */
      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        }));
      },
      clearCart: () => set({ items: [], coupon: null, couponMeta: null }),

      /**
       * @param {string} code
       * @returns {Promise<{ ok: boolean; error?: string }>}
       */
      applyCoupon: async (code) => {
        const trimmed = code.trim();
        if (!trimmed) {
          set({ coupon: null, couponMeta: null });
          return { ok: true };
        }
        const subtotal = get().getSubtotal();
        try {
          const res = await fetch("/api/coupons/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: trimmed, subtotal }),
          });
          const json = await res.json();
          if (!json.success) {
            return { ok: false, error: typeof json.error === "string" ? json.error : "Invalid coupon" };
          }
          set({
            coupon: json.data.code,
            couponMeta: {
              discount: json.data.discount,
              title: json.data.title,
              discountType: json.data.discountType,
            },
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Could not verify coupon" };
        }
      },

      removeCoupon: () => set({ coupon: null, couponMeta: null }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getDiscount: () => get().couponMeta?.discount ?? 0,
      getTotal: () => Math.max(0, get().getSubtotal() - get().getDiscount()),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "shoplib-cart-v1" }
  )
);
