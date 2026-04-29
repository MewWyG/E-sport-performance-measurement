type MetricCardProps = {
  label: string
  value: string
  helper?: string
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/55 p-5">
      <p className="text-sm font-semibold text-sp-text-subtle">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-sp-text">
        {value}
      </p>

      {helper ? (
        <p className="mt-1 text-xs leading-relaxed text-sp-text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  )
}