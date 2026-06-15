import { z } from "zod";

export const placeOrderSchema = z.object({
  paymentMethod: z.enum([
    "stripe",
    "paypal",
    "cod",
    "bank",
    "wallet",
    "orange_money",
    "mtn_mobile_money",
  ]),
  guestEmail: z.string().email().optional(),
  guestName: z.string().optional(),
});

const addressSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().optional(),
  country: z.string().min(1, "Required"),
  zipCode: z.string().optional(),
  landmark: z.string().optional(),
  county: z.string().optional(),
});

const cartLineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.coerce.number().int().positive(),
});

export const checkoutBodySchema = z
  .object({
    deliveryType: z.enum(["shipping", "pickup"]).default("shipping"),
    pickupPointId: z.string().min(1).optional().nullable(),
    paymentMethod: z.enum(["stripe", "paypal", "cod", "bank", "wallet"]),
    shippingAddress: addressSchema.optional(),
    guestEmail: z.string().email().optional(),
    guestName: z.string().optional(),
    items: z.array(cartLineSchema).min(1).max(100),
    coupon: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === "pickup") {
      if (!data.pickupPointId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a pickup location",
          path: ["pickupPointId"],
        });
      }
      const contact = data.shippingAddress;
      if (!contact?.firstName?.trim() || !contact?.lastName?.trim() || !contact?.phone?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Contact name and phone are required for pickup",
          path: ["shippingAddress"],
        });
      }
    } else {
      if (!data.shippingAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shipping address is required",
          path: ["shippingAddress"],
        });
      }
      if (!data.deliveryCompanyId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a delivery company",
          path: ["deliveryCompanyId"],
        });
      }
    }
  });

const ORDER_STATUSES = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

export const adminOrderPatchSchema = z.object({
  orderStatus: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  trackingId: z.string().nullable().optional(),
  comment: z.string().max(2000).optional(),
});
