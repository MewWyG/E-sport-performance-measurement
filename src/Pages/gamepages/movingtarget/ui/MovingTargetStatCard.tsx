type MovingTargetStatCardProps = {
  label: string
  value: string
}

// แสดงสถิติแต่ละค่าของเกมในรูปแบบการ์ด
export function MovingTargetStatCard({
  label,
  value,
}: MovingTargetStatCardProps) {
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