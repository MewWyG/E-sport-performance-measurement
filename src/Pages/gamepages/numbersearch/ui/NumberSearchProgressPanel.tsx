type NumberSearchProgressPanelProps = {
  clickedNumbers: number[]
}

export function NumberSearchProgressPanel({
  clickedNumbers,
}: NumberSearchProgressPanelProps) {
  return (
    <div className="mb-6 rounded-sp-xl border border-sp-border bg-sp-surface/50 p-5">
      <div className="mb-4">
        <p className="text-sm font-bold text-sp-text">
          เลขที่กดถูกแล้วใน Level นี้
        </p>

        <p className="mt-1 text-sm text-sp-text-subtle">
          ใช้ดูว่าผู้เล่นกดเลขอะไรผ่านไปแล้ว โดยผู้เล่นต้องหาเลขถัดไปเองจากตัวเลขบนสนาม
        </p>
      </div>

      {clickedNumbers.length > 0 ? (
        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
          {clickedNumbers.map((number, index) => (
            <span
              key={`${number}-${index}`}
              className="rounded-sp-pill border border-sp-border bg-sp-bg px-3 py-1 text-sm font-bold text-sp-text"
            >
              {number}
            </span>
          ))}
        </div>
      ) : (
        <div className="rounded-sp-xl border border-dashed border-sp-border bg-sp-bg/60 p-4 text-sm text-sp-text-subtle">
          ยังไม่ได้กดเลขถูกใน Level นี้
        </div>
      )}
    </div>
  )
}