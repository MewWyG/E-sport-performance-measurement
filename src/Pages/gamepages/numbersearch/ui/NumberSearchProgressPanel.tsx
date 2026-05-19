type NumberSearchProgressPanelProps = {
  clickedNumbers: number[]
}

export function NumberSearchProgressPanel({
  clickedNumbers,
}: NumberSearchProgressPanelProps) {
  return (
    <div className="mb-5 flex justify-center">
      <div className="flex max-w-full items-center justify-center gap-3 overflow-x-auto rounded-sp-pill border border-sp-border bg-sp-surface/60 px-4 py-3 shadow-sp-soft backdrop-blur-xl">
        {clickedNumbers.length > 0 ? (
          clickedNumbers.map((number) => (
            <div
              key={`clicked-number-${number}`}
              className="flex h-14 min-w-14 items-center justify-center rounded-sp-lg bg-sp-primary px-4 text-xl font-black text-white shadow-sp-brand"
            >
              {number}
            </div>
          ))
        ) : (
          <div className="flex h-14 min-w-14 items-center justify-center rounded-sp-lg bg-sp-surface-muted px-4 text-xl font-black text-sp-text-subtle">
            -
          </div>
        )}
      </div>
    </div>
  )
}