import { z } from "zod";

export const sellerOrderItemPatchSchema = z.object({
  deliveryStatus: z.enum([
    "pending",
    "order_confirmed",
    "preparing",
    "waiting_pickup",
    "picked_up",
    "out_for_delivery",
    "on_the_way",
    "arrived",
    "delivered",
    "shipped",
    "cancelled",
  ]),
  sellerOrderStatus: z.enum(["pending", "accepted", "rejected", "preparing", "ready_for_delivery"]).optional(),
  trackingId: z.string().max(200).nullable().optional(),
});
