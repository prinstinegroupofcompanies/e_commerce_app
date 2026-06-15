/** Markay Hall order & delivery status constants */

export const SELLER_ORDER_STATUSES = ["pending", "accepted", "rejected", "preparing", "ready_for_delivery"];

export const DELIVERY_TRACKING_STATUSES = [
  "pending",
  "order_confirmed",
  "preparing",
  "waiting_pickup",
  "picked_up",
  "out_for_delivery",
  "on_the_way",
  "arrived",
  "delivered",
  "cancelled",
];

export const DELIVERY_ASSIGNMENT_STATUSES = [
  "pending_accept",
  "accepted",
  "picked_up",
  "out_for_delivery",
  "arrived",
  "delivered",
  "rejected",
  "cancelled",
];

export const STORE_VERIFICATION = ["pending", "approved", "rejected"];

export const AD_STATUSES = ["pending", "approved", "rejected", "active", "expired"];

export const TRACKING_LABELS = {
  pending: "Order placed",
  order_confirmed: "Order confirmed",
  preparing: "Preparing item",
  waiting_pickup: "Waiting for pickup",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  on_the_way: "On the way",
  arrived: "Arrived",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function generateDeliveryOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
