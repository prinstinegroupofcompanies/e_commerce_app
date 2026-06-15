/**
 * Build options for a parent <select>, excluding a category and its descendants.
 * @param {{ id: string; name: string; parentId: string | null; sortOrder: number }[]} flat
 * @param {string | undefined} excludeId
 * @returns {{ id: string; label: string }[]}
 */
export function buildCategoryParentOptions(flat, excludeId) {
  const blocked = new Set();
  if (excludeId) {
    blocked.add(excludeId);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of flat) {
        if (c.parentId && blocked.has(c.parentId) && !blocked.has(c.id)) {
          blocked.add(c.id);
          changed = true;
        }
      }
    }
  }

  const roots = flat
    .filter((c) => !c.parentId && !blocked.has(c.id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  /** @type {{ id: string; label: string }[]} */
  const out = [];

  /**
   * @param {typeof flat} nodes
   * @param {number} depth
   */
  function walk(nodes, depth) {
    const sorted = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    for (const n of sorted) {
      if (blocked.has(n.id)) continue;
      const pad = depth > 0 ? `${"— ".repeat(depth)}` : "";
      out.push({ id: n.id, label: `${pad}${n.name}` });
      const kids = flat.filter((c) => c.parentId === n.id);
      walk(kids, depth + 1);
    }
  }

  walk(roots, 0);
  return out;
}
