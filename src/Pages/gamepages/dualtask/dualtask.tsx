import { Link, useNavigate } from 'react-router'
import { DualTaskIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import {
  DUAL_TASK_DIFFICULTY_PRESETS,
  type DualTaskDifficulty,
} from './constants'
import { DualTaskCanvas } from './components/DualTaskCanvas'
import { SequenceOverlay } from './components/SequenceOverlay'
import { useDualTaskGame } from './hooks/useDualTaskGame'

export default function DualTaskGamePage() {
  const navigate = useNavigate()

  const {
    status,
    difficultyMode,
    selectedConfig,
    liveStats,
    activeSequence,
    targetRef,
    pointerRef,
    setDifficultyMode,
    startGame,
    resetGame,
    updatePointer,
  } = useDualTaskGame({
    onFinish: (result) => {
      navigate('/gameplay/dualtask/result', {
        state: { result },
      })
    },
  })

  const timeLeftSec = Math.ceil(liveStats.timeLeftMs / 1000)
  const isPlaying = status === 'playing'

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-10 md:px-12 md:py-14">
        <section className="animate-sp-fade-in">
          <Link
            to="/gameinfo/dualtask"
            className="group mb-8 inline-flex items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>

            <span>กลับไปหน้าข้อมูลเกม</span>
          </Link>

          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sp-xl bg-sp-info-soft text-sp-info shadow-sp-brand">
              <DualTaskIcon className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-sp-secondary">
                Dual Task Test
              </p>

              <h1 className="mt-2 text-4xl font-black text-sp-text md:text-5xl">
                Aim & Input
              </h1>

              <p className="mt-3 max-w-3xl text-sp-text-muted">
                ใช้เมาส์ติดตามเป้าหมายที่เคลื่อนที่ พร้อมกับกดปุ่มตามลำดับที่ปรากฏ
              </p>
            </div>
          </div>

          <DifficultySelector
            value={difficultyMode}
            disabled={isPlaying}
            onChange={setDifficultyMode}
          />

          <section className="mx-auto max-w-[1040px] rounded-sp-card border border-sp-border bg-sp-glass p-3 backdrop-blur-xl md:p-4">
            <div className="relative overflow-hidden rounded-sp-card border border-sp-border bg-sp-bg-soft">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 p-4 md:p-5">
                <div className="flex flex-wrap gap-3">
                  <HudChip label="TIME" value={`${timeLeftSec}s`} />

                  <HudChip
                    label="MODE"
                    value={selectedConfig.label.toUpperCase()}
                  />

                  <HudChip
                    label="TRACK"
                    value={`${liveStats.trackingAccuracy.toFixed(1)}%`}
                  />

                  <HudChip
                    label="INPUT"
                    value={`${liveStats.inputAccuracy.toFixed(1)}%`}
                  />
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-sp-lg border border-sp-border bg-sp-surface/90 px-4 py-2 text-sm font-bold text-sp-text transition-colors hover:bg-sp-surface-strong"
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>

              <DualTaskCanvas
                targetRef={targetRef}
                pointerRef={pointerRef}
                canvasWidth={selectedConfig.canvasWidth}
                canvasHeight={selectedConfig.canvasHeight}
                onPointerMove={updatePointer}
              />

              {status !== 'playing' ? (
                <button
                  type="button"
                  onClick={startGame}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-sp-bg/55 px-6 text-center backdrop-blur-[2px] transition hover:bg-sp-bg/45"
                >
                  <div className="rounded-sp-xl border border-sp-border bg-sp-glass px-8 py-8 shadow-sp-brand backdrop-blur-xl">
                    <p className="text-sm font-bold uppercase tracking-[0.24em] text-sp-secondary">
                      Click To Start
                    </p>

                    <h2 className="mt-3 text-4xl font-black text-sp-text">
                      กดเพื่อเริ่มเล่น
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-sp-text-muted md:text-base">
                      โหมดปัจจุบันคือ {selectedConfig.label}
                      {' '}คลิกในกรอบนี้เพื่อเริ่มทดสอบทันที
                      จากนั้นให้ใช้เมาส์ติดตามเป้าหมาย
                      และกดปุ่มตามลำดับที่แสดงด้านล่างสนาม
                    </p>
                  </div>
                </button>
              ) : null}
            </div>

            {status === 'playing' ? (
              <div className="mt-2 flex justify-center">
                <div className="w-full max-w-sm">
                  <SequenceOverlay sequence={activeSequence} />
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

type DifficultySelectorProps = {
  value: DualTaskDifficulty
  disabled: boolean
  onChange: (mode: DualTaskDifficulty) => void
}

function DifficultySelector({
  value,
  disabled,
  onChange,
}: DifficultySelectorProps) {
  const difficultyEntries = Object.entries(
    DUAL_TASK_DIFFICULTY_PRESETS,
  ) as Array<[DualTaskDifficulty, (typeof DUAL_TASK_DIFFICULTY_PRESETS)[DualTaskDifficulty]]>

  return (
    <section className="mb-4 rounded-sp-card border border-sp-border bg-sp-glass p-3 backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sp-secondary">
            Difficulty Mode
          </p>
        </div>

        {disabled ? (
          <p className="rounded-sp-pill border border-sp-border bg-sp-surface/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sp-text-subtle">
            Locked While Playing
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {difficultyEntries.map(([mode, config]) => (
          <DifficultyButton
            key={mode}
            mode={mode}
            label={config.label}
            isActive={value === mode}
            disabled={disabled}
            onClick={() => onChange(mode)}
          />
        ))}
      </div>
    </section>
  )
}

type DifficultyButtonProps = {
  mode: DualTaskDifficulty
  label: string
  isActive: boolean
  disabled: boolean
  onClick: () => void
}

function DifficultyButton({
  mode,
  label,
  isActive,
  disabled,
  onClick,
}: DifficultyButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'rounded-sp-xl border p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'border-sp-info bg-sp-info-soft shadow-sp-brand'
          : 'border-sp-border bg-sp-surface/55 hover:-translate-y-0.5 hover:bg-sp-surface-strong',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sp-text-subtle">
            {mode}
          </p>

          <h3 className="mt-1 text-xl font-black text-sp-text">
            {label}
          </h3>
        </div>

        <span
          className={[
            'rounded-sp-pill px-3 py-1 text-xs font-black uppercase tracking-[0.14em]',
            isActive
              ? 'bg-sp-info text-sp-bg'
              : 'bg-sp-bg/70 text-sp-text-muted',
          ].join(' ')}
        >
          {isActive ? 'Selected' : 'Choose'}
        </span>
      </div>
    </button>
  )
}

type HudChipProps = {
  label: string
  value: string
}

function HudChip({ label, value }: HudChipProps) {
  return (
    <div className="min-w-[96px] rounded-sp-lg border border-sp-border bg-sp-glass/90 px-4 py-3 backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sp-text-subtle">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-sp-text md:text-xl">
        {value}
      </p>
    </div>
  )
}