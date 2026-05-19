type NumberSearchProgressPanelProps = {
  clickedNumbers: number[]
}

export function NumberSearchProgressPanel({
  clickedNumbers,
}: NumberSearchProgressPanelProps) {
  const latestNumber =
    clickedNumbers.length > 0
      ? clickedNumbers[clickedNumbers.length - 1]
      : null

  return (
    <div className="mb-5 flex justify-center">
      <div className="flex max-w-full items-center justify-center gap-3 overflow-x-auto px-2 py-1">
        {clickedNumbers.length > 0 ? (
          clickedNumbers.map((number) => {
            const isLatest = number === latestNumber

            return (
              <div
                key={`clicked-number-${number}`}
                className={
                  isLatest
                    ? 'flex h-14 min-w-14 items-center justify-center rounded-sp-lg bg-sp-primary px-4 text-xl font-black text-white shadow-sp-brand'
                    : 'flex h-14 min-w-14 items-center justify-center rounded-sp-lg bg-sp-surface-muted px-4 text-xl font-black text-sp-text-muted'
                }
              >
                {number}
              </div>
            )
          })
        ) : (
          <div className="flex h-14 min-w-14 items-center justify-center rounded-sp-lg bg-sp-surface-muted px-4 text-xl font-black text-sp-text-subtle">
            -
          </div>
        )}
      </div>
    </div>
  )
}