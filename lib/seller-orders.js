/**
 * Orders that include at least one line item belonging to this seller.
 * @param {string} sellerId
 * @returns {import("@prisma/client").Prisma.OrderWhereInput}
 */
export function sellerOrdersWhere(sellerId) {
  return { items: { some: { sellerId } } };
}

/**
 * @param {{ quantity: number; subtotal: number; commission: number; sellerEarning: number }[]} lines
 */
export function summarizeSellerLines(lines) {
  return lines.reduce(
    (acc, line) => ({
      quantity: acc.quantity + line.quantity,
      subtotal: acc.subtotal + line.subtotal,
      commission: acc.commission + line.commission,
      sellerEarning: acc.sellerEarning + line.sellerEarning,
    }),
    { quantity: 0, subtotal: 0, commission: 0, sellerEarning: 0 }
  );
}
