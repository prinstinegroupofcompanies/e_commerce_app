/** User-facing labels for order and line-item statuses (DB values unchanged). */

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  processing: "Processing",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const DELIVERY_STATUS_LABELS = {
  pending: "Pending",
  order_confirmed: "Order confirmed",
  preparing: "Preparing",
  waiting_pickup: "Waiting for pickup",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  on_the_way: "On the way",
  arrived: "Arrived",
  delivered: "Delivered",
  shipped: "Out for delivery",
};

/**
 * @param {string | null | undefined} status
 */
export function formatOrderStatus(status) {
  if (!status) return "—";
  return ORDER_STATUS_LABELS[status] || status.replace(/_/g, " ");
}

/**
 * @param {string | null | undefined} status
 */
export function formatDeliveryStatus(status) {
  if (!status) return "—";
  return DELIVERY_STATUS_LABELS[status] || status.replace(/_/g, " ");
}
