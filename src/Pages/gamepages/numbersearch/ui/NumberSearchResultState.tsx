import { AppButton } from '../../../../components/common/AppButton'
import { WRONG_CLICK_LIMIT } from '../config'
import type { NumberSearchStats } from '../types'
import { formatTime } from '../utils/format'

type NumberSearchResultStateProps = {
  stats: NumberSearchStats
  onRetry: () => void
  onBack: () => void
}

export function NumberSearchResultState({
  stats,
  onRetry,
  onBack,
}: NumberSearchResultStateProps) {
  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sp-primary text-white shadow-sp-brand">
        <svg
          className="h-10 w-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-4xl font-black text-sp-text">
        จบเกม!
      </h2>

      <p className="mb-8 text-sp-text-muted">
        นี่คือผลการเล่น Number Search ของคุณ
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <ResultBox label="Level ที่ไปถึง" value={`${stats.levelReached}`} />
        <ResultBox label="กดถูกทั้งหมด" value={`${stats.correctClicks}`} />
        <ResultBox
          label="กดผิด"
          value={`${stats.wrongClicks}/${WRONG_CLICK_LIMIT}`}
        />
        <ResultBox label="เวลา" value={formatTime(stats.elapsedMs)} />
        <ResultBox
          label="เวลาเฉลี่ย"
          value={`${stats.averageFindTime} ms`}
        />
        <ResultBox label="Score" value={`${stats.score}`} />
      </div>

      <div className="flex flex-col justify-center gap-4 md:flex-row">
        <AppButton onClick={onRetry} className="px-8 py-4">
          เล่นใหม่อีกครั้ง
        </AppButton>

        <AppButton variant="glass" onClick={onBack} className="px-8 py-4">
          กลับไปคลังเกม
        </AppButton>
      </div>
    </div>
  )
}

type ResultBoxProps = {
  label: string
  value: string
}

function ResultBox({ label, value }: ResultBoxProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/60 p-5">
      <p className="mb-1 text-sm font-semibold text-sp-text-subtle">
        {label}
      </p>

      <p className="text-xl font-black text-sp-text">
        {value}
      </p>
    </div>
  )
}