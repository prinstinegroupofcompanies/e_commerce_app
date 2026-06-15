import { prisma } from "@/lib/prisma";
import { sendTemplateEmail } from "@/lib/email";

const DEFAULT_IDLE_MS = 1000 * 60 * 60 * 24; // 24h

/**
 * Sends cart abandonment reminders for stale customer carts.
 * @param {{ idleMs?: number; limit?: number }} [opts]
 */
export async function processCartAbandonmentReminders(opts = {}) {
  const idleMs = opts.idleMs ?? DEFAULT_IDLE_MS;
  const limit = opts.limit ?? 50;
  const cutoff = new Date(Date.now() - idleMs);

  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: { lt: cutoff },
      abandonmentReminderSentAt: null,
      items: { some: {} },
      customer: {
        email: { not: "" },
        isActive: true,
      },
    },
    take: limit,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { take: 5 },
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let sent = 0;

  for (const cart of carts) {
    const itemCount = cart.items.length;
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    try {
      await sendTemplateEmail({
        to: cart.customer.email,
        subject: "You left items in your cart",
        template: "cart-abandonment.hbs",
        data: {
          name: cart.customer.name,
          itemCount,
          subtotal: subtotal.toFixed(2),
          cartUrl: `${base}/cart`,
        },
      });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { abandonmentReminderSentAt: new Date() },
      });
      sent += 1;
    } catch (err) {
      console.error("[cart-abandonment]", cart.id, err);
    }
  }

  const guestCutoff = cutoff;
  const guestLeads = await prisma.cartAbandonmentLead.findMany({
    where: {
      updatedAt: { lt: guestCutoff },
      abandonmentReminderSentAt: null,
      subtotal: { gt: 0 },
    },
    take: limit,
  });

  for (const lead of guestLeads) {
    let itemCount = 0;
    try {
      const parsed = JSON.parse(lead.items);
      itemCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      itemCount = 0;
    }
    if (itemCount === 0) continue;

    try {
      await sendTemplateEmail({
        to: lead.email,
        subject: "You left items in your cart",
        template: "cart-abandonment.hbs",
        data: {
          name: lead.email.split("@")[0] || "there",
          itemCount,
          subtotal: lead.subtotal.toFixed(2),
          cartUrl: `${base}/cart`,
        },
      });
      await prisma.cartAbandonmentLead.update({
        where: { id: lead.id },
        data: { abandonmentReminderSentAt: new Date() },
      });
      sent += 1;
    } catch (err) {
      console.error("[cart-abandonment-guest]", lead.id, err);
    }
  }

  return { processed: carts.length, guestLeads: guestLeads.length, sent };
}
