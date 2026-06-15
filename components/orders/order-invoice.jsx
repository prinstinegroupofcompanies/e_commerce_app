import { LOGO_SRC, SITE_NAME } from "@/lib/brand";

function parseAddress(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

export function OrderInvoice({ order, currency = "$" }) {
  const shipping = parseAddress(order.shippingAddress);
  const billing = order.billingAddress ? parseAddress(order.billingAddress) : shipping;

  return (
    <div className="invoice mx-auto max-w-3xl bg-white p-8 text-sm text-slate-900 print:p-0">
      <div className="flex items-start justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt={SITE_NAME} className="h-12 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-[#002395]">{SITE_NAME}</p>
            <p className="text-xs text-slate-500">Invoice / Receipt</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-bold">{order.code}</p>
          <p className="text-xs text-slate-500">
            Issued: {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-500">Status: {order.orderStatus}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Payment: {order.paymentStatus}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 py-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Billed to
          </p>
          <p className="font-semibold">
            {billing.firstName || shipping.firstName} {billing.lastName || shipping.lastName}
          </p>
          <p>{billing.address || shipping.address}</p>
          <p>
            {billing.city || shipping.city}
            {billing.state || shipping.state ? `, ${billing.state || shipping.state}` : ""}{" "}
            {billing.zipCode || shipping.zipCode || ""}
          </p>
          <p>{billing.country || shipping.country}</p>
          <p className="mt-1 text-slate-600">{billing.phone || shipping.phone}</p>
          {order.customer?.email ? (
            <p className="text-slate-600">{order.customer.email}</p>
          ) : order.guestEmail ? (
            <p className="text-slate-600">{order.guestEmail}</p>
          ) : null}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ship to
          </p>
          <p className="font-semibold">
            {shipping.firstName} {shipping.lastName}
          </p>
          <p>{shipping.address}</p>
          <p>
            {shipping.city}
            {shipping.state ? `, ${shipping.state}` : ""} {shipping.zipCode || ""}
          </p>
          <p>{shipping.country}</p>
          <p className="mt-1 text-slate-600">{shipping.phone}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Unit</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, idx) => (
            <tr key={it.id} className="border-b border-slate-100 align-top">
              <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
              <td className="px-3 py-2">
                <p className="font-medium">{it.name}</p>
                {it.sku ? <p className="text-xs text-slate-500">SKU: {it.sku}</p> : null}
                {it.seller?.shopName ? (
                  <p className="text-xs text-slate-500">Sold by {it.seller.shopName}</p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {currency}
                {it.price.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-medium">
                {currency}
                {it.subtotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
        <Row label="Subtotal" value={`${currency}${order.subtotal.toFixed(2)}`} />
        <Row label="Shipping" value={`${currency}${order.shippingCost.toFixed(2)}`} />
        <Row label="Tax" value={`${currency}${order.tax.toFixed(2)}`} />
        {order.discount > 0 ? (
          <Row label="Discount" value={`- ${currency}${order.discount.toFixed(2)}`} />
        ) : null}
        {order.couponCode ? (
          <Row label={`Coupon (${order.couponCode})`} value={`- ${currency}${(order.couponDiscount || 0).toFixed(2)}`} />
        ) : null}
        <div className="mt-2 flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">
            {currency}
            {order.total.toFixed(2)}
          </span>
        </div>
        <p className="text-right text-xs uppercase tracking-wide text-slate-500">
          Paid via {order.paymentMethod}
        </p>
      </div>

      <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>
          Thank you for shopping with {SITE_NAME}. For any questions about this order, contact us
          quoting the order code <span className="font-mono font-semibold">{order.code}</span>.
        </p>
        {order.trackingId ? (
          <p className="mt-1">
            Tracking reference: <span className="font-mono">{order.trackingId}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
