import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { CONTINUOUS_TRACKING_CONFIG } from './config'
import { ContinuousTrackingEngine } from './engine/gameengine'
import type {
  ContinuousTrackingMetrics,
  Difficulty,
  TrialState,
} from './types'

function getAccuracyLabel(score: number): string {
  if (score >= 85) return 'ควบคุมได้ดีมาก'
  if (score >= 70) return 'ควบคุมได้ดี'
  if (score >= 50) return 'พอใช้'
  return 'ควรฝึกเพิ่ม'
}

function getOnTargetLabel(percent: number): string {
  if (percent >= 90) return 'อยู่บนเป้าได้ดีมาก'
  if (percent >= 75) return 'อยู่บนเป้าได้ดี'
  if (percent >= 55) return 'พอใช้'
  return 'หลุดเป้าบ่อย'
}

export function ContinuousTrackingGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<ContinuousTrackingEngine | null>(null)
  const countdownTimerRef = useRef<number | null>(null)

  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [durationSec, setDurationSec] = useState(30)
  const [state, setState] = useState<TrialState>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [metrics, setMetrics] = useState<ContinuousTrackingMetrics | null>(null)
  const [liveAccuracy, setLiveAccuracy] = useState(0)

  const isRunning = state === 'countdown' || state === 'running'
  const difficultyLabel = CONTINUOUS_TRACKING_CONFIG.difficulty[difficulty].label

  function clearCountdown(): void {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  function startActualGame(): void {
    const engine = engineRef.current
    if (!engine) return

    engine.start({
      difficulty,
      durationSec,
    })
  }

  function startGame(): void {
    const engine = engineRef.current
    if (!engine) return

    clearCountdown()
    engine.reset()

    setMetrics(null)
    setLiveAccuracy(0)
    setTimeLeft(durationSec)
    setState('countdown')

    let count = CONTINUOUS_TRACKING_CONFIG.countdownSec
    setCountdown(count)

    countdownTimerRef.current = window.setInterval(() => {
      count -= 1

      if (count > 0) {
        setCountdown(count)
        return
      }

      clearCountdown()
      setCountdown(null)
      startActualGame()
    }, 1000)
  }

  function resetGame(): void {
    clearCountdown()

    engineRef.current?.reset()

    setCountdown(null)
    setTimeLeft(0)
    setLiveAccuracy(0)
    setMetrics(null)
    setState('idle')
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>): void {
    engineRef.current?.setCursorFromClientPoint(e.clientX, e.clientY)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = CONTINUOUS_TRACKING_CONFIG.canvas.width
    canvas.height = CONTINUOUS_TRACKING_CONFIG.canvas.height

    const engine = new ContinuousTrackingEngine(canvas, {
      onUpdate: (update) => {
        setState(update.state)
        setTimeLeft(update.timeLeft)
        setLiveAccuracy(update.liveAccuracy)
        setMetrics(update.metrics)
      },
      onFinish: (finalMetrics) => {
        setMetrics(finalMetrics)
      },
    })

    engineRef.current = engine

    return () => {
      clearCountdown()
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[92rem] flex-grow px-4 py-8 md:px-8">
        <div className="mb-6">
          <Link
            to="/librarygame"
            className="mb-4 inline-flex text-sm font-bold text-sp-primary hover:underline"
          >
            ← กลับไปคลังเกม
          </Link>

          <h1 className="text-3xl font-black text-sp-text">
            Continuous Tracking
          </h1>

          <p className="mt-2 text-sp-text-muted">
            ควบคุมเมาส์ให้ตามเป้าหมายที่เคลื่อนที่แบบสุ่มอย่างมีมาตรฐาน
            ยิ่งอยู่ใกล้กึ่งกลางเป้า คะแนนรวมยิ่งสูง
          </p>
        </div>

        <section className="mb-6 rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="text-sm font-bold text-sp-text-muted">
              ระดับความยาก
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.currentTarget.value as Difficulty)
                }
                disabled={isRunning}
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label className="text-sm font-bold text-sp-text-muted">
              ระยะเวลา
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.currentTarget.value))}
                disabled={isRunning}
              >
                {CONTINUOUS_TRACKING_CONFIG.durationOptions.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}s
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
              <p className="text-sm text-sp-text-muted">ความแม่นกลางเป้าขณะเล่น</p>
              <p className="text-2xl font-black text-sp-text">
                {state === 'idle' ? '-' : `${liveAccuracy.toFixed(0)}%`}
              </p>
            </div>

            <div className="flex items-end gap-3">
              <button
                className="rounded-2xl bg-sp-primary px-5 py-3 font-bold text-white hover:opacity-90 disabled:opacity-50"
                onClick={startGame}
                disabled={isRunning}
              >
                เริ่มทดสอบ
              </button>

              <button
                className="rounded-2xl border border-sp-border bg-sp-card px-5 py-3 font-bold text-sp-text hover:bg-sp-card-hover"
                onClick={resetGame}
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_340px]">
          <section className="rounded-3xl border border-sp-border bg-sp-card p-4 shadow-sp-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-sp-text">
                  พื้นที่ทดสอบ
                </h2>

                <p className="text-sm text-sp-text-muted">
                  {state === 'running'
                    ? 'ควบคุม cursor ให้อยู่บนเป้า และพยายามให้อยู่ใกล้กึ่งกลางมากที่สุด'
                    : 'กดเริ่มทดสอบเพื่อเริ่มเกม'}
                </p>
              </div>

              <div className="rounded-full border border-sp-border bg-sp-bg px-4 py-2 text-sm font-bold text-sp-text">
                {state === 'running'
                  ? `${timeLeft.toFixed(1)}s`
                  : state === 'countdown'
                    ? 'เตรียมพร้อม'
                    : state === 'finished'
                      ? 'เสร็จสิ้น'
                      : difficultyLabel}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-sp-border bg-black">
              <canvas
                ref={canvasRef}
                width={CONTINUOUS_TRACKING_CONFIG.canvas.width}
                height={CONTINUOUS_TRACKING_CONFIG.canvas.height}
                className="block h-auto w-full cursor-none"
                onMouseMove={handleCanvasMouseMove}
              />

              {countdown !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-sm">
                  <div className="mb-3 text-lg font-bold text-sp-text-muted">
                    เตรียมพร้อม
                  </div>

                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-sp-border bg-sp-primary text-6xl font-black text-white shadow-sp-brand">
                    {countdown}
                  </div>

                  <div className="mt-4 text-sm font-bold text-sp-text-muted">
                    เมาส์จะถูกล็อกเมื่อเริ่มเกม
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
              <h3 className="mb-4 text-xl font-black text-sp-text">
                ผลการทดสอบ
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    อยู่บนเป้าหมาย
                  </p>
                  <p className="text-3xl font-black text-sp-text">
                    {metrics
                      ? `${metrics.timeOnTargetPercent.toFixed(1)}%`
                      : '-'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-sp-primary">
                    {metrics
                      ? getOnTargetLabel(metrics.timeOnTargetPercent)
                      : ''}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    ความแม่นกลางเป้า
                  </p>
                  <p className="text-2xl font-black text-sp-text">
                    {metrics
                      ? `${metrics.trackingAccuracy.toFixed(0)}%`
                      : '-'}
                  </p>
                  <p className="mt-1 text-xs text-sp-text-muted">
                    ยิ่งอยู่ใกล้กึ่งกลางเป้ายิ่งสูง
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">ระยะพลาดเฉลี่ย</p>
                  <p className="text-2xl font-black text-sp-text">
                    {metrics ? `${metrics.meanError.toFixed(1)} px` : '-'}
                  </p>
                  <p className="mt-1 text-xs text-sp-text-muted">
                    ระยะจาก cursor ถึงกึ่งกลางเป้า
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">คะแนนรวม</p>
                  <p className="text-3xl font-black text-sp-text">
                    {metrics ? metrics.totalScore : '-'}
                  </p>
                  <p className="mt-1 text-xs text-sp-text-muted">
                    คิดจากความใกล้กึ่งกลางเป้าเป็นหลัก
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
              <h3 className="mb-3 text-xl font-black text-sp-text">
                วิธีเล่น
              </h3>

              <ul className="space-y-2 text-sm text-sp-text-muted">
                <li>• Easy: เป้าใหญ่ เคลื่อนที่ช้า ทิศทางง่าย</li>
                <li>• Normal: เร็วขึ้น เป้าเล็กลง ทิศทางยากขึ้น</li>
                <li>• Hard: เร็วสุด เป้าเล็กสุด เปลี่ยนทิศทางยากที่สุด</li>
                <li>• อยู่บนเป้าหมายมากเท่าไร ค่าอยู่บนเป้าหมายยิ่งสูง</li>
                <li>• ยิ่ง cursor อยู่ใกล้กึ่งกลางเป้า คะแนนรวมยิ่งสูง</li>
                <li>• กด Esc เพื่อออกจาก pointer lock และจบเกมทันที</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default ContinuousTrackingGamePage