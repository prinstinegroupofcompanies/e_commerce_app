import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-response";
import { getStripe } from "@/lib/stripe";
import { isPayPalConfigured } from "@/lib/paypal";

export const dynamic = "force-dynamic";

const DEFAULT_METHODS = [
  { id: "cod", name: "cod", displayName: "Cash on delivery", isActive: true },
  { id: "bank", name: "bank", displayName: "Bank transfer", isActive: true },
  { id: "orange_money", name: "orange_money", displayName: "Orange Money", isActive: true },
  { id: "mtn_mobile_money", name: "mtn_mobile_money", displayName: "MTN Mobile Money", isActive: true },
];

/** Map DB payment method names to checkout ids */
const NAME_TO_ID = {
  cod: "cod",
  "cash on delivery": "cod",
  bank: "bank",
  "bank transfer": "bank",
  stripe: "stripe",
  card: "stripe",
  paypal: "paypal",
  wallet: "wallet",
  "orange money": "orange_money",
  orange_money: "orange_money",
  "mtn mobile money": "mtn_mobile_money",
  mtn_mobile_money: "mtn_mobile_money",
  mtn: "mtn_mobile_money",
};

export async function GET() {
  const rows = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { displayName: "asc" },
    select: { id: true, name: true, displayName: true },
  });

  /** @type {{ id: string; name: string; displayName: string; available: boolean }[]} */
  let methods =
    rows.length > 0
      ? rows.map((r) => {
          const key = r.name.trim().toLowerCase();
          const checkoutId = NAME_TO_ID[key] || key;
          return {
            id: checkoutId,
            name: r.name,
            displayName: r.displayName,
            available: true,
          };
        })
      : DEFAULT_METHODS.map((m) => ({ ...m, available: true }));

  const stripeOk = Boolean(getStripe() && process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
  const paypalOk = isPayPalConfigured();

  methods = methods.filter((m) => {
    if (m.id === "stripe") return stripeOk;
    if (m.id === "paypal") return paypalOk;
    return true;
  });

  if (methods.length === 0) {
    methods = DEFAULT_METHODS.filter((m) => m.id !== "stripe" && m.id !== "paypal").map((m) => ({
      ...m,
      available: true,
    }));
  }

  return jsonSuccess({ methods });
}
