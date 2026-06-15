import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

/**
 * Resolve customer phone from profile or order shipping JSON.
 * @param {{ customerId?: string | null; shippingAddressJson?: string | null; guestPhone?: string | null }}
 */
export async function resolveCustomerPhone({ customerId, shippingAddressJson, guestPhone }) {
  if (guestPhone?.trim()) return guestPhone.trim();

  if (shippingAddressJson) {
    try {
      const addr = JSON.parse(shippingAddressJson);
      if (addr?.phone?.trim()) return addr.phone.trim();
    } catch {
      /* ignore */
    }
  }

  if (customerId) {
    const c = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { phone: true },
    });
    if (c?.phone?.trim()) return c.phone.trim();
  }

  return null;
}

/**
 * @param {{ customerId?: string | null; orderId?: string | null; phone?: string | null; body: string }}
 */
export async function smsCustomer({ customerId, orderId, phone, body }) {
  let resolvedPhone = phone;
  let shippingAddressJson = null;

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, shippingAddress: true, guestEmail: true },
    });
    if (order) {
      customerId = customerId || order.customerId;
      shippingAddressJson = order.shippingAddress;
    }
  }

  if (!resolvedPhone) {
    resolvedPhone = await resolveCustomerPhone({
      customerId,
      shippingAddressJson,
    });
  }

  if (!resolvedPhone) return { skipped: true, reason: "no_phone" };
  return sendSms({ to: resolvedPhone, body });
}
