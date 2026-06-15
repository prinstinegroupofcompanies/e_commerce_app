/**
 * @param {number} amount
 * @param {string} [currency]
 */
export function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
}
