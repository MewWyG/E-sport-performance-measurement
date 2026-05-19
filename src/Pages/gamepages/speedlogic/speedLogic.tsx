import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { SpeedLogicIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import {
  SPEED_LOGIC_TEST_PRESETS,
  type SpeedLogicTestMode,
} from './constants'
import { MetricCard } from './components/MetricCard'
import { QuestionCard } from './components/QuestionCard'
import { useSpeedLogicGame } from './hooks/useSpeedLogicGame'

export default function SpeedLogicGamePage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownTimeoutRef = useRef<number | null>(null)

  const {
    status,
    testMode,
    selectedConfig,
    currentQuestion,
    liveStats,
    setTestMode,
    startGame,
    resetGame,
    answerQuestion,
  } = useSpeedLogicGame({
    onFinish: (result) => {
      navigate('/gameplay/speedlogic/result', {
        state: { result },
      })
    },
  })

  useEffect(() => {
    return () => {
      if (countdownTimeoutRef.current !== null) {
        window.clearTimeout(countdownTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (countdown === null) return

    countdownTimeoutRef.current = window.setTimeout(() => {
      setCountdown((prev) => {
        if (prev === null) return null

        if (prev <= 1) {
          startGame()
          return null
        }

        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownTimeoutRef.current !== null) {
        window.clearTimeout(countdownTimeoutRef.current)
        countdownTimeoutRef.current = null
      }
    }
  }, [countdown, startGame])

  const handleStartRequest = () => {
    if (status === 'playing' || countdown !== null) return
    setCountdown(3)
  }

  const handleReset = () => {
    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current)
      countdownTimeoutRef.current = null
    }

    setCountdown(null)
    resetGame()
  }

  const timeLeftSec = Math.ceil(liveStats.timeLeftMs / 1000)
  const isPlayingOrCountingDown = status === 'playing' || countdown !== null

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-10 md:px-12 md:py-14">
        <section className="animate-sp-fade-in">
          <Link
            to="/gameinfo/speedlogic"
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

          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sp-xl bg-sp-warning-soft text-sp-warning shadow-sp-brand">
              <SpeedLogicIcon className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-sp-secondary">
                Processing Speed Test
              </p>

              <h1 className="mt-2 text-4xl font-black text-sp-text md:text-5xl">
                Speed Logic
              </h1>

              <p className="mt-3 max-w-3xl text-sp-text-muted">
                ตอบโจทย์ logic และตัวเลขให้ถูกต้องและเร็วที่สุดภายในเวลาที่กำหนด
              </p>
            </div>
          </div>

          <TestModeSelector
            value={testMode}
            disabled={isPlayingOrCountingDown}
            onChange={setTestMode}
          />

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
            <MetricCard
              label="Time Left"
              value={`${timeLeftSec}s`}
              helper="เวลาที่เหลือ"
            />

            <MetricCard
              label="Mode"
              value={selectedConfig.label.toUpperCase()}
              helper={selectedConfig.scheduleVersion}
            />

            <MetricCard
              label="Accuracy"
              value={`${liveStats.accuracy.toFixed(1)}%`}
              helper="เปอร์เซ็นต์ตอบถูก"
            />

            <MetricCard
              label="Avg Response"
              value={`${liveStats.avgResponseTimeMs.toFixed(0)} ms`}
              helper="เวลาตอบเฉลี่ย"
            />

            <MetricCard
              label="Score"
              value={`${liveStats.score}`}
              helper="คะแนนรวม"
            />
          </div>

          <QuestionCard
            question={currentQuestion}
            status={status}
            countdown={countdown}
            disabled={status !== 'playing'}
            onAnswer={answerQuestion}
            onStartRequest={handleStartRequest}
            onReset={handleReset}
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

type TestModeSelectorProps = {
  value: SpeedLogicTestMode
  disabled: boolean
  onChange: (mode: SpeedLogicTestMode) => void
}

function TestModeSelector({
  value,
  disabled,
  onChange,
}: TestModeSelectorProps) {
  const modeEntries = Object.entries(SPEED_LOGIC_TEST_PRESETS) as Array<
    [SpeedLogicTestMode, (typeof SPEED_LOGIC_TEST_PRESETS)[SpeedLogicTestMode]]
  >

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
        {modeEntries.map(([mode, config]) => (
          <TestModeButton
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

type TestModeButtonProps = {
  mode: SpeedLogicTestMode
  label: string
  isActive: boolean
  disabled: boolean
  onClick: () => void
}

function TestModeButton({
  mode,
  label,
  isActive,
  disabled,
  onClick,
}: TestModeButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'rounded-sp-xl border p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'border-sp-warning bg-sp-warning-soft shadow-sp-brand'
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
              ? 'bg-sp-warning text-sp-bg'
              : 'bg-sp-bg/70 text-sp-text-muted',
          ].join(' ')}
        >
          {isActive ? 'Selected' : 'Choose'}
        </span>
      </div>
    </button>
  )
}