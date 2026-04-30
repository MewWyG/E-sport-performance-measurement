import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { PREDICTION_CONFIG } from './config'
import { PredictionEngine } from './engine/PredictionEngine'
import { getPathGuidePoints, getTargetPosition } from './engine/PredictionMotion'
import {
  calculateTrialResult,
  createNoResponseResult,
  getValidResults,
} from './engine/PredictionScoring'
import type {
  FeedbackState,
  GamePhase,
  Point,
  SeedMode,
  SpeedMode,
  TrialResult,
} from './types'
import { formatMs, mean } from './utils/math'

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent<HTMLCanvasElement>,
): Point {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

function generateRandomSeed(): number {
  return Math.floor(Math.random() * PREDICTION_CONFIG.seed.maxRandomSeed) + 1
}

function getAccuracyFromError(errorPx: number): number {
  const perfectThreshold = 10
  const failThreshold = 140

  if (!Number.isFinite(errorPx)) return 0
  if (errorPx <= perfectThreshold) return 100
  if (errorPx >= failThreshold) return 0

  return Math.max(
    0,
    Math.min(
      100,
      100 -
        ((errorPx - perfectThreshold) / (failThreshold - perfectThreshold)) *
          100,
    ),
  )
}

function getTimingAccuracyFromError(errorMs: number): number {
  const perfectThreshold = 80
  const failThreshold = 700

  if (!Number.isFinite(errorMs)) return 0

  const absError = Math.abs(errorMs)

  if (absError <= perfectThreshold) return 100
  if (absError >= failThreshold) return 0

  return Math.max(
    0,
    Math.min(
      100,
      100 -
        ((absError - perfectThreshold) / (failThreshold - perfectThreshold)) *
          100,
    ),
  )
}

function getAccuracyLabel(score: number): string {
  if (score >= 85) return 'แม่นยำมาก'
  if (score >= 70) return 'ดี'
  if (score >= 50) return 'พอใช้'
  return 'ควรฝึกเพิ่ม'
}

function getPredictionBiasLabel(alongBias: number): string {
  if (!Number.isFinite(alongBias)) return '-'

  if (alongBias > 20) return 'มักคลิกนำหน้าเป้าหมาย'
  if (alongBias < -20) return 'มักคลิกช้ากว่าเป้าหมาย'
  return 'คาดการณ์ใกล้ตำแหน่งจริง'
}

export function PredictionInterceptGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const engineRef = useRef(new PredictionEngine())

  const [phase, setPhase] = useState<GamePhase>('idle')
  const [trialCount, setTrialCount] = useState<number>(
    PREDICTION_CONFIG.trial.defaultTrialCount,
  )
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal')
  const [seedMode, setSeedMode] = useState<SeedMode>('random')
  const [seedInput, setSeedInput] = useState(
    String(PREDICTION_CONFIG.seed.defaultSeed),
  )
  const [activeSeed, setActiveSeed] = useState<number | null>(null)
  const [copySeedStatus, setCopySeedStatus] = useState('')
  const [results, setResults] = useState<TrialResult[]>([])
  const [statusText, setStatusText] = useState('กดเริ่มทดสอบเพื่อเริ่มเกม')

  const validResults = getValidResults(results)

  const predictionErrors = validResults.map((result) => result.predictionError)
  const timingErrors = validResults.map((result) => result.timingError)
  const alongBiasValues = validResults.map((result) => result.alongBias)

  const meanPredictionError = mean(predictionErrors)
  const meanAbsTimingError = mean(timingErrors.map((value) => Math.abs(value)))
  const meanAlongBias = mean(alongBiasValues)

  const predictionAccuracy = validResults.length
    ? getAccuracyFromError(meanPredictionError)
    : 0

  const timingAccuracy = validResults.length
    ? getTimingAccuracyFromError(meanAbsTimingError)
    : 0

  const overallAccuracy = validResults.length
    ? predictionAccuracy * 0.75 + timingAccuracy * 0.25
    : 0

  const accuracyLabel = validResults.length
    ? getAccuracyLabel(overallAccuracy)
    : ''

  const biasLabel = validResults.length
    ? getPredictionBiasLabel(meanAlongBias)
    : '-'

  const phaseLabel: Record<GamePhase, string> = {
    idle: 'พร้อม',
    visible: 'กำลังสังเกต',
    hidden: 'เป้าหมายหายไป',
    feedback: 'เฉลยตำแหน่ง',
    finished: 'เสร็จสิ้น',
  }

  const isRunning =
    phase === 'visible' || phase === 'hidden' || phase === 'feedback'

  function syncFromEngine(): void {
    const engine = engineRef.current
    setPhase(engine.phase)
    setCurrentTrialIndex(engine.currentTrialIndex)
    setResults([...engine.results])
  }

  function stopLoop(): void {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  function drawGrid(ctx: CanvasRenderingContext2D): void {
    const { width, height, margin } = PREDICTION_CONFIG.canvas
    const colors = PREDICTION_CONFIG.colors

    ctx.save()
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 1

    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    ctx.strokeStyle = colors.border
    ctx.lineWidth = 2
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2)
    ctx.restore()
  }

  function drawTarget(ctx: CanvasRenderingContext2D, point: Point): void {
    const { radius, ringRadius } = PREDICTION_CONFIG.target
    const colors = PREDICTION_CONFIG.colors

    ctx.save()

    ctx.fillStyle = colors.targetRing
    ctx.beginPath()
    ctx.arc(point.x, point.y, ringRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = colors.target
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  function drawPathGuide(ctx: CanvasRenderingContext2D): void {
    const trial = engineRef.current.trial
    if (!trial) return

    const points = getPathGuidePoints(trial)
    if (points.length < 2) return

    ctx.save()
    ctx.strokeStyle = PREDICTION_CONFIG.colors.guideLine
    ctx.lineWidth = 3
    ctx.setLineDash([10, 8])
    ctx.beginPath()

    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y)
    }

    ctx.stroke()
    ctx.restore()
  }

  function drawClick(ctx: CanvasRenderingContext2D, point: Point): void {
    const colors = PREDICTION_CONFIG.colors

    ctx.save()
    ctx.strokeStyle = colors.click
    ctx.lineWidth = 3

    ctx.beginPath()
    ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(point.x - 18, point.y)
    ctx.lineTo(point.x + 18, point.y)
    ctx.moveTo(point.x, point.y - 18)
    ctx.lineTo(point.x, point.y + 18)
    ctx.stroke()

    ctx.restore()
  }

  function drawFeedback(
    ctx: CanvasRenderingContext2D,
    click: Point | null,
    actual: Point | null,
    error: number | null,
  ): void {
    if (!actual) return

    drawTarget(ctx, actual)

    if (click) {
      drawClick(ctx, click)

      ctx.save()
      ctx.strokeStyle = PREDICTION_CONFIG.colors.errorLine
      ctx.lineWidth = 2
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      ctx.moveTo(click.x, click.y)
      ctx.lineTo(actual.x, actual.y)
      ctx.stroke()
      ctx.restore()
    }

    ctx.save()
    ctx.fillStyle = PREDICTION_CONFIG.colors.text
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText(
      error !== null && Number.isFinite(error)
        ? `Prediction Error: ${error.toFixed(1)} px`
        : 'No response',
      32,
      42,
    )
    ctx.restore()
  }

  function renderStatic(): void {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGrid(ctx)

    ctx.save()
    ctx.fillStyle = PREDICTION_CONFIG.colors.muted
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('กดเริ่มทดสอบเพื่อเริ่มเกม', 32, 42)
    ctx.restore()
  }

  function goNextTrial(): void {
    const engine = engineRef.current
    const now = performance.now()

    const nextTrial = engine.goNextTrial(now)

    if (!nextTrial) {
      setStatusText('จบการทดสอบแล้ว')
      syncFromEngine()
      stopLoop()
      renderStatic()
      return
    }

    setStatusText('สังเกตทิศทางและความเร็วของเป้าหมาย')
    syncFromEngine()

    stopLoop()
    frameRef.current = requestAnimationFrame(renderFrame)
  }

  function renderFrame(now: number): void {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const engine = engineRef.current
    const trial = engine.trial
    const phaseNow = engine.phase

    drawGrid(ctx)

    if (!trial) {
      renderStatic()
      return
    }

    drawPathGuide(ctx)

    const elapsed = now - trial.startAt
    const target = getTargetPosition(trial, elapsed)

    if (phaseNow === 'visible') {
      drawTarget(ctx, target)

      if (elapsed >= trial.visibleMs) {
        engine.setHidden(now)
        setStatusText(
          'เป้าหมายหายไปแล้ว คลิกตำแหน่งที่คุณคิดว่าเป้าหมายจะไปถึง',
        )
        syncFromEngine()
      }
    }

    if (phaseNow === 'hidden') {
      ctx.save()
      ctx.fillStyle = PREDICTION_CONFIG.colors.text
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('คลิกตำแหน่งที่คาดว่าเป้าหมายจะอยู่', 32, 42)
      ctx.restore()

      const hiddenElapsed = now - trial.hiddenStartAt
      const timeoutMs =
        trial.occlusionMs + PREDICTION_CONFIG.trial.noResponseGraceMs

      if (hiddenElapsed > timeoutMs) {
        const result = createNoResponseResult(trial, now)

        engine.addResult(result)

        const feedback: FeedbackState = {
          until: now + PREDICTION_CONFIG.trial.feedbackMs,
          click: null,
          actual: result.actual,
          error: null,
        }

        engine.setFeedback(feedback)
        setStatusText('ไม่พบการตอบสนองในรอบนี้')
        syncFromEngine()
      }
    }

    if (phaseNow === 'feedback') {
      const feedback = engine.feedback

      if (feedback) {
        drawFeedback(ctx, feedback.click, feedback.actual, feedback.error)

        if (now >= feedback.until) {
          goNextTrial()
          return
        }
      }
    }

    frameRef.current = requestAnimationFrame(renderFrame)
  }

  function startGame(): void {
    const engine = engineRef.current
    const now = performance.now()

    const seed =
      seedMode === 'fixed'
        ? Number(seedInput) || PREDICTION_CONFIG.seed.defaultSeed
        : generateRandomSeed()

    setActiveSeed(seed)

    engine.configure({
      trialCount,
      speedMode,
      seed,
    })

    engine.start(now)

    setStatusText('สังเกตทิศทางและความเร็วของเป้าหมาย')
    syncFromEngine()

    stopLoop()
    frameRef.current = requestAnimationFrame(renderFrame)
  }

  function resetGame(): void {
    const engine = engineRef.current

    stopLoop()
    engine.reset()

    setStatusText('กดเริ่มทดสอบเพื่อเริ่มเกม')
    syncFromEngine()
    renderStatic()
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>): void {
    const canvas = canvasRef.current
    const engine = engineRef.current
    const trial = engine.trial

    if (!canvas || !trial) return
    if (engine.phase !== 'hidden') return

    const now = performance.now()
    const click = getCanvasPoint(canvas, e)

    const result = calculateTrialResult(trial, click, now)

    engine.addResult(result)

    const feedback: FeedbackState = {
      until: now + PREDICTION_CONFIG.trial.feedbackMs,
      click,
      actual: result.actual,
      error: result.predictionError,
    }

    engine.setFeedback(feedback)

    setStatusText(
      `Prediction Error ${result.predictionError.toFixed(
        1,
      )} px • Timing Error ${formatMs(result.timingError)}`,
    )

    syncFromEngine()
  }

  async function copyActiveSeed(): Promise<void> {
    if (!activeSeed) {
      setCopySeedStatus('ยังไม่มี Seed ให้คัดลอก')
      return
    }

    try {
      await navigator.clipboard.writeText(String(activeSeed))
      setCopySeedStatus(`คัดลอก Seed ${activeSeed} แล้ว`)
    } catch {
      setCopySeedStatus('คัดลอก Seed ไม่สำเร็จ')
    }

    window.setTimeout(() => {
      setCopySeedStatus('')
    }, 1800)
  }

  useEffect(() => {
    renderStatic()

    return () => {
      stopLoop()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-8 md:px-12">
        <div className="mb-6">
          <Link
            to="/librarygame"
            className="mb-4 inline-flex text-sm font-bold text-sp-primary hover:underline"
          >
            ← กลับไปคลังเกม
          </Link>

          <h1 className="text-3xl font-black text-sp-text">
            Prediction Intercept
          </h1>

          <p className="mt-2 text-sp-text-muted">
            เป้าหมายจะเคลื่อนที่เป็นเส้นตรงแบบควบคุมได้ เมื่อเป้าหมายหายไป
            ให้คลิกตำแหน่งที่คิดว่าเป้าหมายจะไปถึง
          </p>
        </div>

        <section className="mb-6 rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <label className="text-sm font-bold text-sp-text-muted">
              จำนวนรอบ
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={trialCount}
                onChange={(e) => setTrialCount(Number(e.currentTarget.value))}
                disabled={isRunning}
              >
                <option value={5}>5 Trials</option>
                <option value={8}>8 Trials</option>
                <option value={10}>10 Trials</option>
                <option value={15}>15 Trials</option>
              </select>
            </label>

            <label className="text-sm font-bold text-sp-text-muted">
              ความเร็ว
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={speedMode}
                onChange={(e) =>
                  setSpeedMode(e.currentTarget.value as SpeedMode)
                }
                disabled={isRunning}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>

            <label className="text-sm font-bold text-sp-text-muted">
              โหมด Seed
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={seedMode}
                onChange={(e) =>
                  setSeedMode(e.currentTarget.value as SeedMode)
                }
                disabled={isRunning}
              >
                <option value="random">Random</option>
                <option value="fixed">Fixed Seed</option>
              </select>
            </label>

            <label className="text-sm font-bold text-sp-text-muted">
              Seed
              <input
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text disabled:opacity-60"
                type="number"
                value={seedInput}
                onChange={(e) => setSeedInput(e.currentTarget.value)}
                disabled={isRunning || seedMode === 'random'}
              />
            </label>

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

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-sp-text-muted">
            <span>
              Seed ที่ใช้:{' '}
              <strong className="text-sp-text">{activeSeed ?? '-'}</strong>
            </span>

            <button
              type="button"
              className="rounded-xl border border-sp-border bg-sp-bg px-3 py-2 font-bold text-sp-text hover:bg-sp-card-hover"
              onClick={copyActiveSeed}
            >
              Copy Seed
            </button>

            <span>{copySeedStatus}</span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-sp-text">
                  พื้นที่ทดสอบ
                </h2>
                <p className="text-sm text-sp-text-muted">{statusText}</p>
              </div>

              <div className="rounded-full border border-sp-border bg-sp-bg px-4 py-2 text-sm font-bold text-sp-text">
                Trial {currentTrialIndex || 0}/{trialCount} •{' '}
                {phaseLabel[phase]}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-sp-border bg-black">
              <canvas
                ref={canvasRef}
                width={PREDICTION_CONFIG.canvas.width}
                height={PREDICTION_CONFIG.canvas.height}
                className="block h-auto w-full cursor-crosshair"
                onClick={handleCanvasClick}
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
              <h3 className="mb-4 text-xl font-black text-sp-text">
                ผลการทดสอบ
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">ความแม่นยำรวม</p>
                  <p className="text-3xl font-black text-sp-text">
                    {validResults.length
                      ? `${overallAccuracy.toFixed(0)}%`
                      : '-'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-sp-primary">
                    {validResults.length ? accuracyLabel : ''}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    ระยะพลาดเฉลี่ย
                  </p>
                  <p className="text-2xl font-black text-sp-text">
                    {validResults.length
                      ? `${meanPredictionError.toFixed(1)} px`
                      : '-'}
                  </p>
                  <p className="mt-1 text-xs text-sp-text-muted">
                    ยิ่งน้อยยิ่งแม่น
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    ความแม่นยำด้านเวลา
                  </p>
                  <p className="text-2xl font-black text-sp-text">
                    {validResults.length
                      ? `${timingAccuracy.toFixed(0)}%`
                      : '-'}
                  </p>
                  <p className="mt-1 text-xs text-sp-text-muted">
                    คำนวณจากการคลิกเร็วหรือช้าเกินไป
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    แนวโน้มการคาดการณ์
                  </p>
                  <p className="text-lg font-black text-sp-text">
                    {validResults.length ? biasLabel : '-'}
                  </p>
                  <p className="mt-1 text-xs text-sp-text-muted">
                    ค่าเฉลี่ยแนวหน้า-หลัง:{' '}
                    {validResults.length
                      ? `${meanAlongBias.toFixed(1)} px`
                      : '-'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
              <h3 className="mb-3 text-xl font-black text-sp-text">
                วิธีเล่น
              </h3>

              <ul className="space-y-2 text-sm text-sp-text-muted">
                <li>• เป้าหมายเคลื่อนที่เป็นเส้นตรงเท่านั้น</li>
                <li>• สังเกตทิศทางและความเร็วของเป้าหมาย</li>
                <li>
                  • เมื่อเป้าหมายหายไป
                  ให้คลิกตำแหน่งที่คาดว่าเป้าหมายจะอยู่
                </li>
                <li>
                  • ใช้ Fixed Seed เพื่อให้ผู้เล่นหลายคนเจอเส้นทางเดียวกัน
                </li>
                <li>• ความแม่นยำรวมยิ่งสูงยิ่งดี</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default PredictionInterceptGamePage