type Props = {
  q: { UL: number; UR: number; LL: number; LR: number };
  total: number;
};

export function QuadrantHeatmap({ q, total }: Props) {
  const max = Math.max(1, q.UL, q.UR, q.LL, q.LR);
  const cell = (n: number) => {
    const intensity = n / max;
    const bg = `rgb(251 113 133 / ${0.18 + intensity * 0.5})`;
    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
    return (
      <div
        className="relative flex items-center justify-center rounded-sp-md border border-sp-border transition"
        style={{ backgroundColor: bg, minHeight: 64 }}
      >
        <div className="text-center">
          <div className="font-mono text-lg font-black text-sp-text drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]">
            {n}
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/85">{pct}%</div>
        </div>
      </div>
    );
  };
  return (
    <div className="grid grid-cols-2 gap-2 rounded-sp-lg border border-sp-border bg-sp-surface-muted p-2">
      {cell(q.UL)}
      {cell(q.UR)}
      {cell(q.LL)}
      {cell(q.LR)}
    </div>
  );
}
