import type { KeySequence } from '../types'

type SequenceOverlayProps = {
  sequence: KeySequence | null
}

export function SequenceOverlay({ sequence }: SequenceOverlayProps) {
  return (
    <div className="px-2 py-2 text-center">
      <h3 className="text-lg font-black text-sp-text">
        กดปุ่มตามลำดับ
      </h3>

      {!sequence ? (
        <p className="mt-2 text-sm text-sp-text-muted">
          รอชุดปุ่มถัดไป...
        </p>
      ) : (
        <div className="mt-3 flex flex-nowrap items-center justify-center gap-2 overflow-visible">
        {sequence.keys.map((key, index) => {
          const isDone = index < sequence.currentIndex
          const isCurrent = index === sequence.currentIndex

          return (
            <div
              key={`${sequence.id}-${key}-${index}`}
              className={[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-sp-lg text-lg font-black transition-all',
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