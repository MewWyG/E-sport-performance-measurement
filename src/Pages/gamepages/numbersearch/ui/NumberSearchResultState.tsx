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
  const wrongLevels = stats.levelEvents.filter(
    (levelEvent) => levelEvent.wrongClicks > 0,
  )

  return (
    <div className="mx-auto w-full max-w-4xl text-center">
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
        <ResultBox label="Level ที่ผ่าน" value={`${stats.completedLevels}`} />
        <ResultBox label="กดถูกทั้งหมด" value={`${stats.correctClicks}`} />
        <ResultBox label="กดผิดทั้งหมด" value={`${stats.wrongClicks}`} />
        <ResultBox label="เวลารวม" value={formatTime(stats.elapsedMs)} />
        <ResultBox
          label="เวลาเฉลี่ยต่อเลข"
          value={`${stats.averageFindTime} ms`}
        />
        <ResultBox label="Score" value={`${stats.score}`} />
      </div>

      <div className="mb-8 grid gap-4 text-left lg:grid-cols-2">
        <ResultPanel title="เวลาแต่ละ Level">
          {stats.levelEvents.length > 0 ? (
            <div className="space-y-3">
              {stats.levelEvents.map((levelEvent) => (
                <LevelRow
                  key={levelEvent.level}
                  levelEvent={levelEvent}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-sp-text-subtle">
              ยังไม่มีข้อมูล Level
            </p>
          )}
        </ResultPanel>

        <ResultPanel title="สรุปการกดผิด">
          {wrongLevels.length > 0 ? (
            <div className="space-y-3">
              {wrongLevels.map((levelEvent) => (
                <div
                  key={levelEvent.level}
                  className="flex items-center justify-between rounded-sp-lg border border-sp-border bg-sp-surface/50 px-4 py-3"
                >
                  <span className="font-semibold text-sp-text">
                    Level {levelEvent.level}
                  </span>

                  <span className="font-mono text-sm font-bold text-sp-danger">
                    ผิด {levelEvent.wrongClicks} ครั้ง
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-sp-lg border border-sp-success/20 bg-sp-success/10 px-4 py-3 text-sm font-semibold text-sp-success">
              ไม่มีกดผิดในเกมนี้
            </p>
          )}
        </ResultPanel>
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

type ResultPanelProps = {
  title: string
  children: React.ReactNode
}

function ResultPanel({ title, children }: ResultPanelProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/60 p-5">
      <h3 className="mb-4 text-lg font-black text-sp-text">
        {title}
      </h3>

      {children}
    </div>
  )
}

type LevelRowProps = {
  levelEvent: NumberSearchLevelEvent
}

function LevelRow({ levelEvent }: LevelRowProps) {
  return (
    <div className="rounded-sp-lg border border-sp-border bg-sp-surface/50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-bold text-sp-text">
          Level {levelEvent.level}
        </span>

        <span className="font-mono text-sm font-bold text-sp-primary-hover">
          {formatTime(levelEvent.durationMs)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-sp-text-subtle">
        <span>ตัวเลข {levelEvent.numberCount}</span>
        <span>ผิด {levelEvent.wrongClicks}</span>
        <span>เฉลี่ย {levelEvent.averageFindTime} ms</span>
      </div>
    </div>
  )
}