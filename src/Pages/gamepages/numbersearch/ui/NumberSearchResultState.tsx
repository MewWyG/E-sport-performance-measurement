import { AppButton } from '../../../../components/common/AppButton'
import type {
  NumberSearchLevelEvent,
  NumberSearchStats,
} from '../types'
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
  const hasLevelData = stats.levelEvents.length > 0
  const hasWrongClicks = stats.wrongClicks > 0

  return (
    <div className="mx-auto w-full max-w-5xl pb-6">
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
        <ResultBox
          label="Level ที่ผ่าน"
          value={`${stats.completedLevels}`}
        />

        <ResultBox
          label="กดถูกทั้งหมด"
          value={`${stats.correctClicks}`}
        />

        <ResultBox
          label="กดผิดทั้งหมด"
          value={`${stats.wrongClicks}`}
        />

        <ResultBox
          label="เวลารวม"
          value={formatTime(stats.elapsedMs)}
        />

        <ResultBox
          label="เวลาเฉลี่ยต่อเลข"
          value={`${stats.averageFindTime} ms`}
        />

        <ResultBox
          label="Score"
          value={`${stats.score}`}
        />
      </div>

      <div className="mb-8 rounded-sp-xl border border-sp-border bg-sp-surface/60 p-5 text-left">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-black text-sp-text">
              เวลาแต่ละ Level
            </h3>

            <p className="mt-1 text-sm text-sp-text-subtle">
              แสดงเวลาที่ใช้ จำนวนตัวเลข เวลาเฉลี่ย และจำนวนครั้งที่กดผิดในแต่ละ Level
            </p>
          </div>

          <div
            className={
              hasWrongClicks
                ? 'rounded-sp-pill border border-sp-danger/30 bg-sp-danger/10 px-4 py-2 text-sm font-bold text-sp-danger'
                : 'rounded-sp-pill border border-sp-success/30 bg-sp-success/10 px-4 py-2 text-sm font-bold text-sp-success'
            }
          >
            {hasWrongClicks
              ? `กดผิดทั้งหมด ${stats.wrongClicks} ครั้ง`
              : 'ไม่มีกดผิด'}
          </div>
        </div>

        {hasLevelData ? (
          <div className="grid gap-3">
            {stats.levelEvents.map((levelEvent) => (
              <LevelResultRow
                key={levelEvent.level}
                levelEvent={levelEvent}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-sp-lg border border-sp-border bg-sp-surface/50 px-5 py-6 text-center">
            <p className="text-base font-bold text-sp-text">
              ยังไม่มีข้อมูล Level
            </p>

            <p className="mt-1 text-sm text-sp-text-subtle">
              ผู้เล่นยังไม่ได้กดตัวเลขจนจบ Level ใด ๆ
            </p>

            <p className="mt-3 text-sm font-semibold text-sp-success">
              {stats.wrongClicks > 0
                ? `กดผิดทั้งหมด ${stats.wrongClicks} ครั้ง`
                : 'ไม่มีกดผิด'}
            </p>
          </div>
        )}
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

type LevelResultRowProps = {
  levelEvent: NumberSearchLevelEvent
}

function LevelResultRow({ levelEvent }: LevelResultRowProps) {
  const hasWrongClicks = levelEvent.wrongClicks > 0

  return (
    <div className="rounded-sp-lg border border-sp-border bg-sp-surface/50 px-5 py-4">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="text-lg font-black text-sp-text">
            Level {levelEvent.level}
          </h4>

          <p className="text-sm text-sp-text-subtle">
            ตัวเลข {levelEvent.numberCount} ตัว
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="font-mono text-lg font-black text-sp-primary-hover">
            {formatTime(levelEvent.durationMs)}
          </p>

          <p className="text-xs text-sp-text-subtle">
            เวลาใน Level นี้
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <LevelMetric
          label="เวลาเฉลี่ยต่อเลข"
          value={`${levelEvent.averageFindTime} ms`}
        />

        <LevelMetric
          label="กดผิด"
          value={
            hasWrongClicks
              ? `ผิด ${levelEvent.wrongClicks} ครั้ง`
              : '0 ครั้ง'
          }
          danger={hasWrongClicks}
        />
      </div>
    </div>
  )
}

type LevelMetricProps = {
  label: string
  value: string
  danger?: boolean
}

function LevelMetric({
  label,
  value,
  danger = false,
}: LevelMetricProps) {
  return (
    <div className="rounded-sp-lg border border-sp-border bg-sp-bg/40 px-4 py-3">
      <p className="text-xs font-semibold text-sp-text-subtle">
        {label}
      </p>

      <p
        className={
          danger
            ? 'mt-1 font-bold text-sp-danger'
            : 'mt-1 font-bold text-sp-text'
        }
      >
        {value}
      </p>
    </div>
  )
}