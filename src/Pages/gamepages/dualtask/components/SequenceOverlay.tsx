import type { KeySequence } from '../types'

type SequenceOverlayProps = {
  sequence: KeySequence | null
}

export function SequenceOverlay({ sequence }: SequenceOverlayProps) {
  return (
    <div className="rounded-sp-card border border-sp-border bg-sp-glass/85 px-5 py-4 text-center shadow-sp-brand backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-sp-secondary">
        Sequence
      </p>

      <h3 className="mt-2 text-lg font-black text-sp-text">
        กดปุ่มตามลำดับ
      </h3>

      {!sequence ? (
        <p className="mt-3 text-sm text-sp-text-muted">
          รอชุดปุ่มถัดไป...
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {sequence.keys.map((key, index) => {
            const isDone = index < sequence.currentIndex
            const isCurrent = index === sequence.currentIndex

            return (
              <div
                key={`${sequence.id}-${key}-${index}`}
                className={[
                  'flex h-14 w-14 items-center justify-center rounded-sp-lg text-xl font-black transition-all',
                  isDone
                    ? 'bg-sp-success text-sp-bg'
                    : isCurrent
                      ? 'scale-105 bg-sp-secondary text-sp-bg shadow-sp-brand'
                      : 'bg-sp-surface text-sp-text-muted',
                ].join(' ')}
              >
                {key}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}