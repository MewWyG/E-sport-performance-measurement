type NumberSearchStatCardProps = {
  label: string
  value: string
}

export function NumberSearchStatCard({
  label,
  value,
}: NumberSearchStatCardProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/50 p-4">
      <p className="mb-1 text-xs font-semibold text-sp-text-subtle">
        {label}
      </p>

      <p className="text-xl font-black text-sp-text">
        {value}
      </p>
    </div>
  )
}