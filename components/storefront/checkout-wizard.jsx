"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getVisitorKey } from "@/lib/analytics/track-client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ChevronLeft, ChevronRight, Loader2, Lock, MapPin, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";

const STEPS = ["Delivery", "Payment", "Review"];

function StripePayStep({ orderCode, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setBusy(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${typeof window !== "undefined" ? window.location.origin : ""}/order-success?code=${encodeURIComponent(orderCode)}`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Payment failed");
      return;
    }
    onPaid();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Enter card details to pay securely with Stripe.</p>
      <PaymentElement />
      <Button type="button" className="w-full" size="lg" disabled={!stripe || busy} onClick={handlePay}>
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          "Pay now"
        )}
      </Button>
    </div>
  );
}

export function CheckoutWizard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDiscount = useCartStore((s) => s.getDiscount);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [addr, setAddr] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Liberia",
    zipCode: "",
    landmark: "",
    county: "",
  });
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [deliveryCompanyId, setDeliveryCompanyId] = useState("");
  const [deliverySpeed, setDeliverySpeed] = useState(/** @type {"standard"|"express"} */ ("standard"));
  const [paymentMethod, setPaymentMethod] = useState(/** @type {"cod"|"bank"|"stripe"|"paypal"|"wallet"} */ ("cod"));
  const [paymentOptions, setPaymentOptions] = useState(
    /** @type {{ id: string; displayName: string }[]} */ ([
      { id: "cod", displayName: "Cash on delivery" },
      { id: "bank", displayName: "Bank transfer" },
    ]),
  );
  const [walletBalance, setWalletBalance] = useState(/** @type {number | null} */ (null));
  const [deliveryType, setDeliveryType] = useState(/** @type {"shipping"|"pickup"} */ ("shipping"));
  const [pickupPoints, setPickupPoints] = useState([]);
  const [pickupPointId, setPickupPointId] = useState("");
  const [stripeCtx, setStripeCtx] = useState(/** @type {{ clientSecret: string; orderCode: string } | null} */ (null));
  const [mobileMoneyInfo, setMobileMoneyInfo] = useState(
    /** @type {{ reference: string; instructions: string; code: string } | null} */ (null),
  );

  const PAYMENT_DESC = {
    cod: "Pay when your order arrives.",
    bank: "You will receive transfer instructions by email.",
    stripe: "Visa, Mastercard, and more — secure checkout.",
    paypal: "Pay with your PayPal account.",
    wallet: "Use your store wallet balance.",
  };

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = deliveryType === "pickup" ? 0 : subtotal - discount >= 50 ? 0 : 5.99;
  const total = Math.max(0, subtotal - discount + shipping);

  const stripePromise = useMemo(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    if (!pk) return null;
    return loadStripe(pk);
  }, []);

  const isCustomer = session?.user?.role === "customer";

  useEffect(() => {
    if (status === "authenticated" && isCustomer && session.user?.name) {
      const parts = String(session.user.name).trim().split(/\s+/);
      setAddr((a) => ({
        ...a,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      }));
      if (session.user.email) setGuestEmail(session.user.email);
    }
  }, [status, isCustomer, session?.user?.name, session?.user?.email]);

  useEffect(() => {
    fetch("/api/pickup-points")
      .then((r) => r.json())
      .then((j) => {
        const pts = j?.data?.points || [];
        setPickupPoints(pts);
        if (pts.length > 0) setPickupPointId((cur) => cur || pts[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/delivery-companies")
      .then((r) => r.json())
      .then((j) => {
        const list = j?.data || [];
        setDeliveryCompanies(list);
        if (list.length > 0) setDeliveryCompanyId((cur) => cur || list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((j) => {
        const methods = j?.data?.methods || [];
        if (methods.length > 0) {
          setPaymentOptions(methods.map((m) => ({ id: m.id, displayName: m.displayName })));
          setPaymentMethod((cur) => {
            if (methods.some((m) => m.id === cur)) return cur;
            return methods[0].id;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isCustomer) {
      setWalletBalance(null);
      return;
    }
    fetch("/api/customer/profile")
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && typeof j.data?.walletBalance === "number") {
          setWalletBalance(j.data.walletBalance);
        }
      })
      .catch(() => {});
  }, [isCustomer, status]);

  if (mobileMoneyInfo) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12">
        <h1 className="text-2xl font-bold">Complete mobile money payment</h1>
        <p className="text-sm text-muted-foreground">Order {mobileMoneyInfo.code}</p>
        <Card>
          <CardContent className="space-y-3 p-6 text-sm">
            <p>
              <span className="font-medium">Reference: </span>
              <span className="font-mono">{mobileMoneyInfo.reference}</span>
            </p>
            <p className="leading-relaxed text-muted-foreground">{mobileMoneyInfo.instructions}</p>
            <p className="text-xs text-muted-foreground">
              After you pay, Markay Hall will confirm your order. You can track it anytime.
            </p>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/track-order?code=${encodeURIComponent(mobileMoneyInfo.code)}`}>Track order</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!items.length && !stripeCtx) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add something before checking out.</p>
        <Button className="mt-8" asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  function validateDelivery() {
    const a = addr;
    if (!a.firstName.trim() || !a.lastName.trim() || !a.phone.trim()) {
      toast.error("Please enter your name and phone");
      return false;
    }
    if (deliveryType === "pickup") {
      if (!pickupPointId) {
        toast.error("Please select a pickup location");
        return false;
      }
    } else if (!a.address.trim() || !a.city.trim() || !a.country.trim()) {
      toast.error("Please complete all required address fields");
      return false;
    } else if (!deliveryCompanyId) {
      toast.error("Please select a delivery company");
      return false;
    }
    if (!isCustomer) {
      if (!guestName.trim() || !guestEmail.trim()) {
        toast.error("Please enter your name and email for guest checkout");
        return false;
      }
    }
    return true;
  }

  const selectedPickup = pickupPoints.find((p) => p.id === pickupPointId);

  async function placeOrder() {
    setSubmitting(true);
    try {
      const vk = getVisitorKey();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(vk ? { "X-Visitor-Key": vk } : {}),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          deliveryType,
          pickupPointId: deliveryType === "pickup" ? pickupPointId : null,
          paymentMethod,
          shippingAddress: addr,
          guestEmail: isCustomer ? undefined : guestEmail,
          guestName: isCustomer ? undefined : guestName,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          coupon: coupon || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Checkout failed");
        setSubmitting(false);
        return;
      }
      const { code, clientSecret, approvalUrl, mobileMoney, deliveryPin } = json.data;
      if (mobileMoney?.pending) {
        clearCart();
        if (mobileMoney.paymentLink) {
          toast.success("Redirecting to secure mobile money checkout…");
          window.location.href = mobileMoney.paymentLink;
          return;
        }
        setMobileMoneyInfo({
          reference: mobileMoney.reference,
          instructions: mobileMoney.instructions,
          code,
        });
        setSubmitting(false);
        toast.success("Order created — complete mobile money payment");
        return;
      }
      if (paymentMethod === "paypal") {
        if (!approvalUrl) {
          toast.error("Could not start PayPal. Check PayPal credentials.");
          setSubmitting(false);
          return;
        }
        window.location.href = approvalUrl;
        return;
      }
      if (paymentMethod === "stripe") {
        if (!stripePromise) {
          toast.error("Stripe is not configured (missing publishable key).");
          setSubmitting(false);
          return;
        }
        if (!clientSecret) {
          toast.error("Could not start card payment. Configure STRIPE_SECRET_KEY on the server.");
          setSubmitting(false);
          return;
        }
        setStripeCtx({ clientSecret, orderCode: code });
        setSubmitting(false);
        return;
      }
      clearCart();
      toast.success("Order placed");
      const pin = deliveryPin || json.data?.deliveryPin;
      const pinQ = pin ? `&pin=${encodeURIComponent(pin)}` : "";
      router.push(`/order-success?code=${encodeURIComponent(code)}${pinQ}`);
    } catch {
      toast.error("Network error");
    }
    setSubmitting(false);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">Secure delivery details and payment in a few steps.</p>
        </div>

        {stripeCtx && stripePromise ? (
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Card payment</CardTitle>
              <p className="text-sm text-muted-foreground">Order {stripeCtx.orderCode}</p>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret: stripeCtx.clientSecret }}>
                <StripePayStep
                  orderCode={stripeCtx.orderCode}
                  onPaid={() => {
                    clearCart();
                    router.push(`/order-success?code=${encodeURIComponent(stripeCtx.orderCode)}`);
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        ) : (
          <>
            <nav aria-label="Checkout steps" className="mb-8 flex items-center gap-2 text-sm">
              {STEPS.map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`hidden font-medium sm:inline ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  {i < STEPS.length - 1 ? <div className="hidden h-px flex-1 bg-border sm:block" /> : null}
                </div>
              ))}
            </nav>

            {step === 0 ? (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-base font-semibold">Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        deliveryType === "shipping"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/80"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        className="mt-1"
                        checked={deliveryType === "shipping"}
                        onChange={() => setDeliveryType("shipping")}
                      />
                      <span>
                        <span className="flex items-center gap-2 font-medium">
                          <MapPin className="h-4 w-4" />
                          Ship to address
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          Standard delivery to your door.
                        </span>
                      </span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        deliveryType === "pickup"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/80"
                      } ${pickupPoints.length === 0 ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        className="mt-1"
                        checked={deliveryType === "pickup"}
                        disabled={pickupPoints.length === 0}
                        onChange={() => setDeliveryType("pickup")}
                      />
                      <span>
                        <span className="flex items-center gap-2 font-medium">
                          <Store className="h-4 w-4" />
                          Pick up in store
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {pickupPoints.length > 0 ? "Free — collect from a pickup point." : "No pickup points available."}
                        </span>
                      </span>
                    </label>
                  </div>

                  {!isCustomer ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="g-name">Full name</Label>
                        <Input id="g-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} autoComplete="name" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="g-email">Email</Label>
                        <Input id="g-email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} autoComplete="email" />
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fn">First name</Label>
                      <Input id="fn" value={addr.firstName} onChange={(e) => setAddr({ ...addr, firstName: e.target.value })} autoComplete="given-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ln">Last name</Label>
                      <Input id="ln" value={addr.lastName} onChange={(e) => setAddr({ ...addr, lastName: e.target.value })} autoComplete="family-name" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="ph">Phone</Label>
                      <Input id="ph" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} autoComplete="tel" />
                    </div>
                  </div>

                  {deliveryType === "pickup" ? (
                    <div className="space-y-3 rounded-lg border border-primary/15 bg-primary/5 p-4">
                      <Label htmlFor="pickup">Pickup location</Label>
                      {pickupPoints.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No pickup points are configured yet.</p>
                      ) : (
                        <select
                          id="pickup"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={pickupPointId}
                          onChange={(e) => setPickupPointId(e.target.value)}
                        >
                          {pickupPoints.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {p.city}, {p.country}
                            </option>
                          ))}
                        </select>
                      )}
                      {selectedPickup ? (
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{selectedPickup.name}</p>
                          <p>{selectedPickup.address}</p>
                          <p>
                            {selectedPickup.city}, {selectedPickup.country}
                          </p>
                          {selectedPickup.hours ? <p>Hours: {selectedPickup.hours}</p> : null}
                          {selectedPickup.phone ? <p>Phone: {selectedPickup.phone}</p> : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="ad">Delivery address</Label>
                          <Input id="ad" value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} autoComplete="street-address" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="lm">Landmark</Label>
                          <Input id="lm" placeholder="Near JFK Hospital, etc." value={addr.landmark} onChange={(e) => setAddr({ ...addr, landmark: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ct">City</Label>
                          <Input id="ct" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cy">County</Label>
                          <Input id="cy" value={addr.county} onChange={(e) => setAddr({ ...addr, county: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="st">State / region</Label>
                          <Input id="st" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="co">Country</Label>
                          <Input id="co" value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} autoComplete="country" />
                        </div>
                      </div>
                      <div className="space-y-3 rounded-lg border p-4">
                        <p className="text-sm font-medium">Delivery company</p>
                        {deliveryCompanies.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No delivery partners available yet.</p>
                        ) : (
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={deliveryCompanyId}
                            onChange={(e) => setDeliveryCompanyId(e.target.value)}
                          >
                            {deliveryCompanies.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} — Standard ${c.standardFee?.toFixed(2)} / Express ${c.expressFee?.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex gap-4 text-sm">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="speed"
                              checked={deliverySpeed === "standard"}
                              onChange={() => setDeliverySpeed("standard")}
                            />
                            Standard
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="speed"
                              checked={deliverySpeed === "express"}
                              onChange={() => setDeliverySpeed("express")}
                            />
                            Express
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {step === 1 ? (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-base font-semibold">Payment method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {paymentOptions.map((m) => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:border-primary/40 ${
                        paymentMethod === m.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/80 bg-card"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay"
                        className="mt-1"
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(/** @type {typeof paymentMethod} */ (m.id))}
                      />
                      <span>
                        <span className="font-medium">{m.displayName}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {PAYMENT_DESC[m.id] || "Secure payment via Markay Hall."}
                        </span>
                      </span>
                    </label>
                  ))}
                  {!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY && paymentMethod === "stripe" ? (
                    <p className="text-xs text-amber-600">Stripe publishable key is not configured — choose another method or add NEXT_PUBLIC_STRIPE_PUBLIC_KEY.</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                  <CardTitle className="text-base font-semibold">Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {deliveryType === "pickup" ? "Pickup" : "Ship to"}
                    </p>
                    <p className="mt-1 font-medium">
                      {addr.firstName} {addr.lastName} · {addr.phone}
                    </p>
                    {deliveryType === "pickup" && selectedPickup ? (
                      <p className="text-muted-foreground">
                        {selectedPickup.name} — {selectedPickup.address}, {selectedPickup.city}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        {addr.address}, {addr.city} {addr.state} {addr.zipCode}, {addr.country}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                    <p className="mt-1 capitalize">
                      {paymentOptions.find((m) => m.id === paymentMethod)?.displayName || paymentMethod}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Your details are sent over HTTPS and stored for fulfillment only.
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" disabled={step === 0 || submitting} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              {step < 2 ? (
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (step === 0 && !validateDelivery()) return;
                    setStep((s) => s + 1);
                  }}
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" size="lg" className="min-w-[10rem]" disabled={submitting} onClick={placeOrder}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    "Place order"
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <aside className="lg:col-span-5">
        <Card className="sticky top-24 border-border/80 shadow-sm lg:top-28">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-base">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <ul className="max-h-56 space-y-3 overflow-y-auto pr-1 text-sm">
              {items.map((i) => (
                <li key={`${i.productId}-${i.variantId ?? "x"}`} className="flex justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate">
                    {i.name} <span className="text-muted-foreground">×{i.quantity}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">${(i.price * i.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon</span>
                  <span className="tabular-nums">−${discount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="tabular-nums">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/cart">Edit cart</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
