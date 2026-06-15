import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * @typedef {{ productId: string; slug: string; name: string; thumbnail?: string | null; price: number }} WishlistLine
 */

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      /** @type {WishlistLine[]} */
      items: [],
      /**
       * @param {WishlistLine} line
       */
      toggle: (line) => {
        set((state) => {
          const exists = state.items.some((i) => i.productId === line.productId);
          if (exists) {
            return { items: state.items.filter((i) => i.productId !== line.productId) };
          }
          return { items: [...state.items, line] };
        });
      },
      /** @param {string} productId */
      remove: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
      },
      /** @param {string} productId */
      has: (productId) => get().items.some((i) => i.productId === productId),
    }),
    { name: "shoplib-wishlist-v1" }
  )
);
