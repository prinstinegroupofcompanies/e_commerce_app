/**
 * Parse variant options from JSON or legacy "Size: S" strings.
 * @param {string} options
 * @returns {Record<string, string>}
 */
export function parseVariantOptions(options) {
  if (!options || typeof options !== "string") return {};
  const trimmed = options.trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [String(k), String(v)])
      );
    }
  } catch {
    /* fall through */
  }

  const result = {};
  const parts = trimmed.split(/,\s*/);
  for (const part of parts) {
    const match = part.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      result[match[1].trim()] = match[2].trim();
    }
  }
  if (Object.keys(result).length === 0 && trimmed) {
    result.Option = trimmed;
  }
  return result;
}

/**
 * @param {Record<string, string>} options
 */
export function formatVariantOptions(options) {
  return JSON.stringify(options);
}

/**
 * Human-readable label for a variant.
 * @param {{ options: string; sku?: string | null }} variant
 */
export function variantLabel(variant) {
  const o = parseVariantOptions(variant.options);
  const entries = Object.entries(o);
  if (entries.length) {
    return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
  }
  return variant.sku || "Variant";
}

/**
 * @param {{ options: string }[]} variants
 * @returns {Record<string, string[]>}
 */
export function groupVariantAttributes(variants) {
  /** @type {Record<string, Set<string>>} */
  const groups = {};
  for (const v of variants) {
    const opts = parseVariantOptions(v.options);
    for (const [key, value] of Object.entries(opts)) {
      if (!groups[key]) groups[key] = new Set();
      groups[key].add(value);
    }
  }
  return Object.fromEntries(
    Object.entries(groups).map(([k, set]) => [k, Array.from(set)])
  );
}

/**
 * @param {{ options: string }[]} variants
 * @param {Record<string, string>} selection
 */
export function findVariantBySelection(variants, selection) {
  return variants.find((v) => {
    const opts = parseVariantOptions(v.options);
    return Object.entries(selection).every(([k, val]) => opts[k] === val);
  });
}

/**
 * @param {{ stock: number; isActive?: boolean }[]} variants
 */
export function totalVariantStock(variants) {
  return variants
    .filter((v) => v.isActive !== false)
    .reduce((sum, v) => sum + (v.stock || 0), 0);
}
