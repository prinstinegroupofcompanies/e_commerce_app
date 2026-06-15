/**
 * Build a JSON-serializable POST body from form values (safe for Server → Client props).
 *
 * @param {Record<string, string>} values
 * @param {{
 *   fields: { key: string; type?: string; omitIfEmpty?: boolean; emptyAsNull?: boolean; defaultValue?: string }[];
 *   extra?: Record<string, unknown>;
 *   defaults?: Record<string, unknown>;
 * }} options
 */
export function buildInlineFormPayload(values, { fields, extra = {}, defaults = {} }) {
  /** @type {Record<string, unknown>} */
  const payload = { ...extra };

  for (const field of fields) {
    const raw = String(values[field.key] ?? "").trim();
    const fallback = field.defaultValue ?? "";

    if (field.omitIfEmpty && !raw) {
      continue;
    }

    if (field.type === "number") {
      payload[field.key] = Number(raw) || 0;
      continue;
    }

    if (field.key === "direction") {
      payload.direction = raw === "rtl" ? "rtl" : "ltr";
      continue;
    }

    if (field.emptyAsNull && !raw) {
      payload[field.key] = null;
      continue;
    }

    payload[field.key] = raw || fallback;
  }

  return { ...payload, ...defaults };
}
