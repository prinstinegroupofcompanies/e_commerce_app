import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { checkoutBodySchema } from "@/lib/validators/order";
import { catalogProductVisibilityWhere } from "@/lib/storefront-catalog";
import { getStripe } from "@/lib/stripe";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import { sendTemplateEmail } from "@/lib/email";
import { notifyMany } from "@/lib/notify";
import { alertCustomer, formatOrderSms } from "@/lib/marketplace-notify";
import { smsSellers } from "@/lib/seller-sms";
import { initiateMobileMoneyPayment, isMobileMoneyMethod } from "@/lib/mobile-money";
import { VISITOR_COOKIE } from "@/lib/chat/visitor";
import { recordPurchaseFromOrder, getOrderItemsForTracking } from "@/lib/chat/purchase";
import { generateDeliveryOtp } from "@/lib/marketplace-statuses";

export const dynamic = "force-dynamic";

function makeOrderCode() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {number} subtotal
 * @param {string | null | undefined} code
 */
async function computeCouponDiscount(tx, subtotal, code) {
  if (!code?.trim()) return { discount: 0, couponCode: null };
  const coupon = await tx.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!coupon || !coupon.isActive) return { discount: 0, couponCode: null };
  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { discount: 0, couponCode: null };
  if (coupon.expiresAt && now > coupon.expiresAt) return { discount: 0, couponCode: null };
  if (subtotal < coupon.minOrderAmount) return { discount: 0, couponCode: null };

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (subtotal * coupon.discount) / 100;
    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.discount;
  }
  discount = Math.min(discount, subtotal);
  return { discount, couponCode: coupon.code };
}

export async function POST(request) {
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = checkoutBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", parsed.error.flatten().fieldErrors, 422);
    }

    const {
      paymentMethod,
      shippingAddress,
      items,
      coupon,
      guestEmail,
      guestName,
      deliveryType,
      pickupPointId,
      deliveryCompanyId,
      deliverySpeed,
    } = parsed.data;
    const isPickup = deliveryType === "pickup";

    const isCustomer = session?.user?.role === "customer";
    const customerId = isCustomer ? session.user.id : null;

    if (!customerId) {
      if (!guestEmail || !guestName) {
        return jsonError("Guest checkout requires name and email", [], 422);
      }
    }

    if (paymentMethod === "wallet" && !customerId) {
      return jsonError("Sign in to pay with your wallet", [], 422);
    }

    if (paymentMethod === "paypal" && !isPayPalConfigured()) {
      return jsonError("PayPal is not configured on this store", [], 503);
    }

    const visibility = catalogProductVisibilityWhere();

    try {
      const result = await prisma.$transaction(async (tx) => {
        /** @type {{ productId: string; variantId: string | null; name: string; sku: string | null; image: string | null; options: string | null; price: number; quantity: number; subtotal: number; sellerId: string | null; commission: number; sellerEarning: number }[]} */
        const orderLines = [];
        let merchandise = 0;

        for (const item of items) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, ...visibility },
            include: {
              variants: true,
              seller: { select: { id: true, commissionRate: true } },
            },
          });
          if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          const hasVariants = product.variants && product.variants.length > 0;
          if (hasVariants && !item.variantId) {
            throw new Error("VARIANT_REQUIRED");
          }

          let unitPrice = product.price;
          let variantId = null;
          let sku = product.sku ?? null;
          let optionsJson = null;
          let stockDecrement = { type: "product", id: product.id, qty: item.quantity };

          if (item.variantId) {
            const v = product.variants.find((x) => x.id === item.variantId);
            if (!v || v.isActive === false) throw new Error("VARIANT_NOT_FOUND");
            if (v.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");
            unitPrice = v.price;
            variantId = v.id;
            sku = v.sku ?? sku;
            optionsJson = v.options || null;
            stockDecrement = { type: "variant", id: v.id, productId: product.id, qty: item.quantity };
          } else {
            if (product.stockQuantity < item.quantity) throw new Error("INSUFFICIENT_STOCK");
          }

          const lineSubtotal = unitPrice * item.quantity;
          merchandise += lineSubtotal;

          const rate = product.seller?.commissionRate ?? 10;
          const commission = product.sellerId ? (lineSubtotal * rate) / 100 : 0;
          const sellerEarning = lineSubtotal - commission;

          orderLines.push({
            productId: product.id,
            variantId,
            name: product.name,
            sku,
            image: (variantId ? product.variants.find((x) => x.id === variantId)?.image : null) || product.thumbnail,
            options: optionsJson,
            price: unitPrice,
            quantity: item.quantity,
            subtotal: lineSubtotal,
            sellerId: product.sellerId,
            commission,
            sellerEarning,
            stockDecrement,
          });
        }

        const { discount, couponCode } = await computeCouponDiscount(tx, merchandise, coupon);

        let resolvedPickupPointId = null;
        let addressPayload = shippingAddress;

        if (isPickup) {
          const point = await tx.pickupPoint.findFirst({
            where: { id: pickupPointId, isActive: true },
          });
          if (!point) throw new Error("PICKUP_POINT_INVALID");
          resolvedPickupPointId = point.id;
          addressPayload = {
            type: "pickup",
            pickupPointId: point.id,
            pickupPointName: point.name,
            pickupAddress: point.address,
            pickupCity: point.city,
            pickupCountry: point.country,
            pickupPhone: point.phone,
            pickupHours: point.hours,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            phone: shippingAddress.phone,
            address: point.address,
            city: point.city,
            country: point.country,
          };
        }

        let deliveryFee = 0;
        let resolvedDeliveryCompanyId = null;
        if (!isPickup && deliveryCompanyId) {
          const company = await tx.deliveryCompany.findFirst({
            where: { id: deliveryCompanyId, isActive: true, verificationStatus: "approved" },
          });
          if (!company) throw new Error("DELIVERY_COMPANY_INVALID");
          resolvedDeliveryCompanyId = company.id;
          deliveryFee =
            deliverySpeed === "express" ? company.expressFee : company.standardFee;
        }

        const baseShipping = isPickup ? 0 : merchandise >= 50 ? 0 : 5.99;
        const shippingCost = isPickup ? 0 : baseShipping + deliveryFee;
        const tax = 0;
        const total = Math.max(0, merchandise - discount + shippingCost + tax);
        const deliveryOtp = !isPickup ? generateDeliveryOtp() : null;

        let code = makeOrderCode();
        for (let i = 0; i < 5; i++) {
          const exists = await tx.order.findUnique({ where: { code }, select: { id: true } });
          if (!exists) break;
          code = makeOrderCode();
        }

        const order = await tx.order.create({
          data: {
            code,
            customerId,
            guestEmail: customerId ? null : guestEmail,
            guestName: customerId ? null : guestName,
            shippingAddress: JSON.stringify(addressPayload),
            billingAddress: null,
            subtotal: merchandise,
            shippingCost,
            discount,
            tax,
            total,
            couponCode,
            couponDiscount: discount > 0 ? discount : null,
            paymentMethod,
            paymentStatus: paymentMethod === "stripe" || paymentMethod === "paypal" ? "pending" : "pending",
            orderStatus: "pending",
            isPickup,
            pickupPointId: resolvedPickupPointId,
            deliveryCompanyId: resolvedDeliveryCompanyId,
            deliverySpeed: isPickup ? null : deliverySpeed || "standard",
            deliveryFee,
            landmark: shippingAddress?.landmark?.trim() || null,
            county: shippingAddress?.county?.trim() || null,
            deliveryOtp,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "pending",
            comment: isPickup ? "Pickup order placed" : "Order placed",
            createdBy: customerId || "guest",
          },
        });

        for (const line of orderLines) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: line.productId,
              variantId: line.variantId,
              name: line.name,
              sku: line.sku,
              image: line.image,
              options: line.options,
              price: line.price,
              quantity: line.quantity,
              subtotal: line.subtotal,
              sellerId: line.sellerId,
              commission: line.commission,
              sellerEarning: line.sellerEarning,
            },
          });

          const sd = line.stockDecrement;
          if (sd.type === "variant") {
            await tx.productVariant.update({
              where: { id: sd.id },
              data: { stock: { decrement: sd.qty } },
            });
          } else {
            await tx.product.update({
              where: { id: sd.id },
              data: { stockQuantity: { decrement: sd.qty } },
            });
          }
        }

        if (customerId) {
          await tx.cart.deleteMany({ where: { customerId } });
        }

        if (couponCode && discount > 0) {
          await tx.coupon.update({
            where: { code: couponCode },
            data: { usageCount: { increment: 1 } },
          });
        }

        const sellerIds = [...new Set(orderLines.map((l) => l.sellerId).filter(Boolean))];
        const orderWithOtp = await tx.order.findUnique({
          where: { id: order.id },
          select: { deliveryOtp: true },
        });
        return {
          order: { ...order, deliveryOtp: orderWithOtp?.deliveryOtp },
          total,
          merchandise,
          discount,
          shippingCost,
          sellerIds,
        };
      });

      try {
        if (result.sellerIds.length > 0) {
          await notifyMany({
            sellerIds: result.sellerIds,
            title: "New order received",
            message: `Order ${result.order.code} includes items from your shop.`,
            type: "info",
            link: `/seller/orders/${result.order.id}`,
          });
          await smsSellers(
            result.sellerIds,
            formatOrderSms(result.order.code, "New order on your store. Open seller dashboard."),
          );
        }
        if (customerId) {
          const pinNote = result.order.deliveryOtp
            ? ` Delivery PIN: ${result.order.deliveryOtp}.`
            : "";
          await alertCustomer({
            customerId,
            orderId: result.order.id,
            title: "Order placed",
            message: `Your order ${result.order.code} has been placed (total $${result.total.toFixed(2)}).${pinNote}`,
            smsBody: formatOrderSms(
              result.order.code,
              `Placed. Total $${result.total.toFixed(2)}.${pinNote}`,
            ),
            type: "success",
            link: `/dashboard/orders/${result.order.id}`,
          });
        } else if (guestEmail && shippingAddress?.phone) {
          const { smsCustomer } = await import("@/lib/customer-sms");
          const pinNote = result.order.deliveryOtp ? ` PIN: ${result.order.deliveryOtp}.` : "";
          await smsCustomer({
            phone: shippingAddress.phone,
            body: formatOrderSms(result.order.code, `Placed.${pinNote}`),
          });
        }
      } catch (err) {
        console.error("[checkout] customer alerts", err);
      }

      const orderEmail = customerId ? session?.user?.email : guestEmail;
      if (orderEmail) {
        try {
          await sendTemplateEmail({
            to: orderEmail,
            subject: `Order confirmation — ${result.order.code}`,
            template: "order-confirmation.hbs",
            data: {
              orderCode: result.order.code,
              total: `$${Number(result.total).toFixed(2)}`,
              deliveryPin: result.order.deliveryOtp || "",
            },
          });
        } catch (err) {
          console.error("[checkout] order confirmation email", err);
        }
      }

      let clientSecret = null;
      let approvalUrl = null;

      if (paymentMethod === "stripe") {
        try {
          const stripe = getStripe();
          if (stripe) {
            const pi = await stripe.paymentIntents.create({
              amount: Math.round(result.total * 100),
              currency: "usd",
              metadata: { orderId: result.order.id, orderCode: result.order.code },
              automatic_payment_methods: { enabled: true },
            });
            clientSecret = pi.client_secret;
            await prisma.transaction.create({
              data: {
                orderId: result.order.id,
                customerId,
                type: "payment",
                method: "stripe",
                amount: result.total,
                status: "pending",
                reference: pi.id,
              },
            });
          }
        } catch (err) {
          console.error("[checkout] Stripe PaymentIntent failed", err);
        }
      }

      if (paymentMethod === "paypal") {
        try {
          const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const pp = await createPayPalOrder({
            amount: result.total,
            orderCode: result.order.code,
            returnUrl: `${base}/checkout/paypal-return?code=${encodeURIComponent(result.order.code)}`,
            cancelUrl: `${base}/checkout?cancelled=paypal`,
          });
          approvalUrl = pp.approvalUrl;
          await prisma.order.update({
            where: { id: result.order.id },
            data: { trackingId: pp.id },
          });
          await prisma.transaction.create({
            data: {
              orderId: result.order.id,
              customerId,
              type: "payment",
              method: "paypal",
              amount: result.total,
              status: "pending",
              reference: pp.id,
            },
          });
        } catch (err) {
          console.error("[checkout] PayPal order failed", err);
          return jsonError("Could not start PayPal checkout", [], 500);
        }
        if (!approvalUrl) {
          return jsonError("PayPal approval URL missing", [], 500);
        }
      }

      const visitorKey =
        request.headers.get("x-visitor-key") || request.cookies.get(VISITOR_COOKIE)?.value;
      if (visitorKey) {
        try {
          const items = await getOrderItemsForTracking(result.order.id);
          await recordPurchaseFromOrder({
            visitorKey,
            customerId,
            orderId: result.order.id,
            orderCode: result.order.code,
            total: result.total,
            items,
          });
        } catch (err) {
          console.error("[checkout] purchase analytics", err);
        }
      }

      let mobileMoney = null;
      if (isMobileMoneyMethod(paymentMethod)) {
        mobileMoney = await initiateMobileMoneyPayment({
          orderId: result.order.id,
          orderCode: result.order.code,
          amount: result.total,
          method: paymentMethod,
          customerId,
          phone: shippingAddress?.phone,
          email: customerId ? session?.user?.email : guestEmail,
          customerName: customerId
            ? session?.user?.name
            : guestName || `${shippingAddress?.firstName || ""} ${shippingAddress?.lastName || ""}`.trim(),
        });
      }

      return jsonSuccess({
        orderId: result.order.id,
        code: result.order.code,
        total: result.total,
        clientSecret,
        approvalUrl,
        paymentMethod,
        paymentStatus:
          paymentMethod === "wallet"
            ? "paid"
            : isMobileMoneyMethod(paymentMethod)
              ? "pending"
              : "pending",
        deliveryPin: result.order.deliveryOtp || null,
        mobileMoney,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "CHECKOUT_FAILED";
      const map = {
        PRODUCT_NOT_FOUND: "A product is no longer available",
        VARIANT_REQUIRED: "Choose a product option",
        VARIANT_NOT_FOUND: "Invalid product variant",
        INSUFFICIENT_STOCK: "Not enough stock for one or more items",
        PICKUP_POINT_INVALID: "Selected pickup location is not available",
        DELIVERY_COMPANY_INVALID: "Selected delivery company is not available",
        INSUFFICIENT_WALLET: "Insufficient wallet balance",
        WALLET_REQUIRES_LOGIN: "Sign in to use wallet payment",
      };
      return jsonError(map[msg] || "Could not complete checkout", [], 400);
    }
  } catch (e) {
    console.error(e);
    return jsonError("Server error", [], 500);
  }
}
