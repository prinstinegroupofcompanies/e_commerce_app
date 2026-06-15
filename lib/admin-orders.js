/** @typedef {"all" | "inhouse" | "seller" | "pickup"} OrdersTab */

/**
 * @param {OrdersTab} tab
 * @returns {import("@prisma/client").Prisma.OrderWhereInput}
 */
export function ordersWhereForTab(tab) {
  switch (tab) {
    case "inhouse":
      return {
        AND: [{ items: { some: {} } }, { items: { every: { sellerId: null } } }],
      };
    case "seller":
      return { items: { some: { sellerId: { not: null } } } };
    case "pickup":
      return { isPickup: true };
    case "all":
    default:
      return {};
  }
}
