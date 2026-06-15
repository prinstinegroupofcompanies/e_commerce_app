import { create } from "zustand";
import { persist } from "zustand/middleware";

export const COMPARE_MAX = 4;

export const useCompareStore = create(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const cur = get().ids;
        if (cur.includes(id)) {
          set({ ids: cur.filter((x) => x !== id) });
          return { added: false };
        }
        if (cur.length >= COMPARE_MAX) {
          return { added: false, full: true };
        }
        set({ ids: [...cur, id] });
        return { added: true };
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
      has: (id) => get().ids.includes(id),
    }),
    { name: "shoplib_compare" },
  ),
);
