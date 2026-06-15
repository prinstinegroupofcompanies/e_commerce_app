/**
 * @param {{
 *   series: { key: string; label: string; values: { label: string; value: number }[]; colorClass?: string }[];
 *   height?: number;
 * }} props
 */
export function AnalyticsBarChart({ series, height = 128 }) {
  const allValues = series.flatMap((s) => s.values.map((v) => v.value));
  const max = Math.max(...allValues, 1);

  if (!series[0]?.values.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No data for this period.</p>;
  }

  const points = series[0].values;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-0.5 overflow-x-auto pb-1" style={{ minHeight: height + 24 }}>
        {points.map((point, i) => (
          <div
            key={`${point.label}-${i}`}
            className="flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1"
            title={series.map((s) => `${s.label}: ${s.values[i]?.value ?? 0}`).join(" · ")}
          >
            <div className="flex w-full items-end justify-center gap-0.5 px-0.5" style={{ height }}>
              {series.map((s) => {
                const val = s.values[i]?.value ?? 0;
                const h = Math.max(2, Math.round((val / max) * height));
                return (
                  <div
                    key={s.key}
                    className={`w-full max-w-[14px] rounded-t ${s.colorClass ?? "bg-primary/80"}`}
                    style={{ height: h }}
                  />
                );
              })}
            </div>
            <span className="max-w-full truncate text-center text-[10px] leading-tight text-muted-foreground">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${s.colorClass ?? "bg-primary/80"}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
