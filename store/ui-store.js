import { create } from "zustand";

export const useUiStore = create((set) => ({
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
}));
