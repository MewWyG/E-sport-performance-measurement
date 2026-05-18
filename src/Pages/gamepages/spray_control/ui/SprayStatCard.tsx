type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-sp-text",
  success: "text-sp-success",
  warning: "text-sp-warning",
  danger: "text-sp-danger",
  info: "text-sp-info",
};

export function SprayStatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-glass px-4 py-3 backdrop-blur-xl">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-sp-text-subtle">
        {label}
      </div>
      <div className={`mt-1 font-mono text-2xl font-black ${toneClass[tone]}`}>{value}</div>
      {hint ? (
        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-sp-text-muted">{hint}</div>
      ) : null}
    </div>
  );
}
