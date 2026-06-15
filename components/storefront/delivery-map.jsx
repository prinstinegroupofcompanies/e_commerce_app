"use client";

/**
 * OpenStreetMap embed for rider / delivery live location.
 * @param {{ lat?: number | null; lng?: number | null; label?: string }}
 */
export function DeliveryMap({ lat, lng, label = "Delivery location" }) {
  if (lat == null || lng == null) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Live location will appear when the rider shares GPS.
      </p>
    );
  }

  const pad = 0.012;
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
  const external = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <iframe
        title={label}
        className="h-52 w-full rounded-lg border"
        src={embed}
        loading="lazy"
      />
      <a href={external} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
        Open full map
      </a>
    </div>
  );
}
