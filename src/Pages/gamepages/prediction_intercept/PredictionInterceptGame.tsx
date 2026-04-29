import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'

type GamePhase = 'idle' | 'visible' | 'hidden' | 'feedback' | 'finished'
type MotionMode = 'linear' | 'curve' | 'acceleration'
type SpeedMode = 'slow' | 'normal' | 'fast'

type Point = {
  x: number
  y: number
}

type TrialConfig = {
  index: number
  startAt: number
  hiddenStartAt: number
  visibleMs: number
  occlusionMs: number
  x0: number
  y0: number
  vx: number
  vy: number
  ax: number
  ay: number
  curveAmplitude: number
  curveFrequency: number
  curvePhase: number
  motionMode: MotionMode
}

type TrialResult = {
  trialIndex: number
  predictionError: number
  timingError: number
  biasX: number
  biasY: number
  alongBias: number
  lateralBias: number
  click: Point
  actual: Point
}

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 640
const MARGIN = 48
const TARGET_RADIUS = 18

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function reflectCoordinate(value: number, min: number, max: number) {
  const range = max - min
  if (range <= 0) return min

  let normalized = (value - min) % (range * 2)
  if (normalized < 0) normalized += range * 2

  if (normalized <= range) {
    return min + normalized
  }

  return max - (normalized - range)
}

function getSpeedValue(speedMode: SpeedMode) {
  if (speedMode === 'slow') return 170
  if (speedMode === 'fast') return 300
  return 230
}

function formatMs(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(0)} ms`
}

function mean(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function createTrial(
  index: number,
  now: number,
  motionMode: MotionMode,
  speedMode: SpeedMode,
): TrialConfig {
  const speed = getSpeedValue(speedMode)
  const angle = randomRange(-Math.PI * 0.85, Math.PI * 0.85)
  const direction = Math.random() < 0.5 ? 1 : -1

  const x0 =
    direction > 0
      ? randomRange(MARGIN + 40, CANVAS_WIDTH * 0.35)
      : randomRange(CANVAS_WIDTH * 0.65, CANVAS_WIDTH - MARGIN - 40)

  const y0 = randomRange(MARGIN + 80, CANVAS_HEIGHT - MARGIN - 80)

  const vx = Math.cos(angle) * speed * direction
  const vy = Math.sin(angle) * speed * 0.55

  const accelerationStrength =
    motionMode === 'acceleration' ? randomRange(50, 110) : 0

  return {
    index,
    startAt: now,
    hiddenStartAt: 0,
    visibleMs: randomRange(950, 1500),
    occlusionMs: randomRange(300, 800),
    x0,
    y0,
    vx,
    vy,
    ax: Math.cos(angle) * accelerationStrength * direction,
    ay: Math.sin(angle) * accelerationStrength * 0.4,
    curveAmplitude: motionMode === 'curve' ? randomRange(45, 95) : 0,
    curveFrequency: randomRange(0.7, 1.15),
    curvePhase: randomRange(0, Math.PI * 2),
    motionMode,
  }
}

function getTargetPosition(trial: TrialConfig, elapsedMs: number): Point {
  const t = elapsedMs / 1000

  let x = trial.x0 + trial.vx * t + 0.5 * trial.ax * t * t
  let y = trial.y0 + trial.vy * t + 0.5 * trial.ay * t * t

  if (trial.motionMode === 'curve') {
    const baseAngle = Math.atan2(trial.vy, trial.vx)
    const perpX = -Math.sin(baseAngle)
    const perpY = Math.cos(baseAngle)
    const wave =
      Math.sin(t * Math.PI * 2 * trial.curveFrequency + trial.curvePhase) *
      trial.curveAmplitude

    x += perpX * wave
    y += perpY * wave
  }

  return {
    x: reflectCoordinate(x, MARGIN, CANVAS_WIDTH - MARGIN),
    y: reflectCoordinate(y, MARGIN, CANVAS_HEIGHT - MARGIN),
  }
}

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

export function PredictionInterceptGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)

  const phaseRef = useRef<GamePhase>('idle')
  const trialRef = useRef<TrialConfig | null>(null)
  const resultsRef = useRef<TrialResult[]>([])
  const feedbackRef = useRef<{
    until: number
    click: Point | null
    actual: Point | null
    error: number | null
  } | null>(null)

  const [phase, setPhase] = useState<GamePhase>('idle')
  const [trialCount, setTrialCount] = useState(8)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [motionMode, setMotionMode] = useState<MotionMode>('linear')
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal')
  const [results, setResults] = useState<TrialResult[]>([])
  const [statusText, setStatusText] = useState('กดเริ่มทดสอบเพื่อเริ่มเกม')

  const phaseLabel: Record<GamePhase, string> = {
    idle: 'พร้อม',
    visible: 'กำลังสังเกต',
    hidden: 'เป้าหมายหายไป',
    feedback: 'เฉลยตำแหน่ง',
    finished: 'เสร็จสิ้น',
  }

  const predictionErrors = results.map((r) => r.predictionError)
  const timingErrors = results.map((r) => r.timingError)
  const alongBiasValues = results.map((r) => r.alongBias)
  const lateralBiasValues = results.map((r) => r.lateralBias)

  const meanPredictionError = mean(predictionErrors)
  const meanAbsTimingError = mean(timingErrors.map((v) => Math.abs(v)))
  const meanAlongBias = mean(alongBiasValues)
  const meanLateralBias = mean(lateralBiasValues)

  function setGamePhase(nextPhase: GamePhase) {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }

  function stopLoop() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  function drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.save()

    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)'
    ctx.lineWidth = 1

    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }

    for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'
    ctx.lineWidth = 2
    ctx.strokeRect(
      MARGIN,
      MARGIN,
      CANVAS_WIDTH - MARGIN * 2,
      CANVAS_HEIGHT - MARGIN * 2,
    )

    ctx.restore()
  }

  function drawTarget(ctx: CanvasRenderingContext2D, point: Point) {
    ctx.save()

    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'
    ctx.beginPath()
    ctx.arc(point.x, point.y, TARGET_RADIUS + 14, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(point.x, point.y, TARGET_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  function drawClick(ctx: CanvasRenderingContext2D, point: Point) {
    ctx.save()

    ctx.strokeStyle = '#f97316'
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
  ) {
    if (!actual) return

    drawTarget(ctx, actual)

    if (click) {
      drawClick(ctx, click)

      ctx.save()
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      ctx.moveTo(click.x, click.y)
      ctx.lineTo(actual.x, actual.y)
      ctx.stroke()
      ctx.restore()
    }

    ctx.save()
    ctx.fillStyle = '#e5e7eb'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText(
      error !== null ? `Prediction Error: ${error.toFixed(1)} px` : 'No response',
      32,
      42,
    )
    ctx.restore()
  }

  function renderFrame(now: number) {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGrid(ctx)

    const trial = trialRef.current
    const phaseNow = phaseRef.current

    if (trial) {
      const elapsed = now - trial.startAt
      const target = getTargetPosition(trial, elapsed)

      if (phaseNow === 'visible') {
        drawTarget(ctx, target)

        if (elapsed >= trial.visibleMs) {
          trial.hiddenStartAt = now
          setGamePhase('hidden')
          setStatusText('เป้าหมายหายไปแล้ว คลิกตำแหน่งที่คุณคิดว่าเป้าหมายจะไปถึง')
        }
      }

      if (phaseNow === 'hidden') {
        ctx.save()
        ctx.fillStyle = '#e5e7eb'
        ctx.font = 'bold 24px sans-serif'
        ctx.fillText('คลิกตำแหน่งที่คาดว่าเป้าหมายจะอยู่', 32, 42)
        ctx.restore()

        const hiddenElapsed = now - trial.hiddenStartAt

        if (hiddenElapsed > trial.occlusionMs + 1500) {
          const actual = getTargetPosition(trial, now - trial.startAt)
          feedbackRef.current = {
            until: now + 900,
            click: null,
            actual,
            error: null,
          }
          setGamePhase('feedback')
          setStatusText('ไม่พบการตอบสนองในรอบนี้')
        }
      }

      if (phaseNow === 'feedback') {
        const feedback = feedbackRef.current
        if (feedback) {
          drawFeedback(ctx, feedback.click, feedback.actual, feedback.error)

          if (now >= feedback.until) {
            goNextTrial()
            return
          }
        }
      }
    } else {
      ctx.save()
      ctx.fillStyle = '#94a3b8'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('กดเริ่มทดสอบเพื่อเริ่มเกม', 32, 42)
      ctx.restore()
    }

    frameRef.current = requestAnimationFrame(renderFrame)
  }

  function startTrial(index: number) {
    const now = performance.now()
    const trial = createTrial(index, now, motionMode, speedMode)

    trialRef.current = trial
    feedbackRef.current = null

    setCurrentTrialIndex(index)
    setGamePhase('visible')
    setStatusText('สังเกตทิศทางและความเร็วของเป้าหมาย')

    stopLoop()
    frameRef.current = requestAnimationFrame(renderFrame)
  }

  function goNextTrial() {
    const next = currentTrialIndex + 1

    if (next > trialCount) {
      trialRef.current = null
      setGamePhase('finished')
      setStatusText('จบการทดสอบแล้ว')
      stopLoop()
      renderStatic()
      return
    }

    startTrial(next)
  }

  function startGame() {
    resultsRef.current = []
    setResults([])
    setCurrentTrialIndex(1)
    setStatusText('เริ่มการทดสอบ')
    startTrial(1)
  }

  function resetGame() {
    stopLoop()
    trialRef.current = null
    feedbackRef.current = null
    resultsRef.current = []

    setResults([])
    setCurrentTrialIndex(0)
    setGamePhase('idle')
    setStatusText('กดเริ่มทดสอบเพื่อเริ่มเกม')

    renderStatic()
  }

  function renderStatic() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGrid(ctx)

    ctx.save()
    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('กดเริ่มทดสอบเพื่อเริ่มเกม', 32, 42)
    ctx.restore()
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const trial = trialRef.current

    if (!canvas || !trial) return
    if (phaseRef.current !== 'hidden') return

    const now = performance.now()
    const click = getCanvasPoint(canvas, e)
    const actual = getTargetPosition(trial, now - trial.startAt)

    const predictionError = distance(click, actual)
    const timingError = now - trial.hiddenStartAt - trial.occlusionMs

    const future = getTargetPosition(trial, now - trial.startAt + 16)
    const velocity = {
      x: future.x - actual.x,
      y: future.y - actual.y,
    }

    const velocityLength = Math.hypot(velocity.x, velocity.y) || 1
    const vx = velocity.x / velocityLength
    const vy = velocity.y / velocityLength

    const errorVector = {
      x: click.x - actual.x,
      y: click.y - actual.y,
    }

    const alongBias = errorVector.x * vx + errorVector.y * vy
    const lateralBias = errorVector.x * -vy + errorVector.y * vx

    const result: TrialResult = {
      trialIndex: trial.index,
      predictionError,
      timingError,
      biasX: errorVector.x,
      biasY: errorVector.y,
      alongBias,
      lateralBias,
      click,
      actual,
    }

    resultsRef.current = [...resultsRef.current, result]
    setResults(resultsRef.current)

    feedbackRef.current = {
      until: now + 900,
      click,
      actual,
      error: predictionError,
    }

    setGamePhase('feedback')
    setStatusText(
      `Prediction Error ${predictionError.toFixed(1)} px • Timing Error ${formatMs(
        timingError,
      )}`,
    )
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
            แบบทดสอบการคาดการณ์ตำแหน่งเป้าหมาย
          </h1>

          <p className="mt-2 text-sp-text-muted">
            สังเกตการเคลื่อนที่ของเป้าหมาย เมื่อเป้าหมายหายไป ให้คลิกตำแหน่งที่คิดว่าเป้าหมายจะไปถึง
          </p>
        </div>

        <section className="mb-6 rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="text-sm font-bold text-sp-text-muted">
              จำนวนรอบ
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={trialCount}
                onChange={(e) => setTrialCount(Number(e.target.value))}
                disabled={phase === 'visible' || phase === 'hidden' || phase === 'feedback'}
              >
                <option value={5}>5 Trials</option>
                <option value={8}>8 Trials</option>
                <option value={10}>10 Trials</option>
                <option value={15}>15 Trials</option>
              </select>
            </label>

            <label className="text-sm font-bold text-sp-text-muted">
              รูปแบบการเคลื่อนที่
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={motionMode}
                onChange={(e) => setMotionMode(e.target.value as MotionMode)}
                disabled={phase === 'visible' || phase === 'hidden' || phase === 'feedback'}
              >
                <option value="linear">Linear</option>
                <option value="curve">Curve</option>
                <option value="acceleration">Acceleration</option>
              </select>
            </label>

            <label className="text-sm font-bold text-sp-text-muted">
              ความเร็ว
              <select
                className="mt-2 w-full rounded-xl border border-sp-border bg-sp-bg px-3 py-3 text-sp-text"
                value={speedMode}
                onChange={(e) => setSpeedMode(e.target.value as SpeedMode)}
                disabled={phase === 'visible' || phase === 'hidden' || phase === 'feedback'}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button
                className="rounded-2xl bg-sp-primary px-5 py-3 font-bold text-white hover:opacity-90 disabled:opacity-50"
                onClick={startGame}
                disabled={phase === 'visible' || phase === 'hidden' || phase === 'feedback'}
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
                Trial {currentTrialIndex || 0}/{trialCount} • {phaseLabel[phase]}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-sp-border bg-black">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
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
                  <p className="text-sm text-sp-text-muted">Mean Prediction Error</p>
                  <p className="text-2xl font-black text-sp-text">
                    {results.length ? `${meanPredictionError.toFixed(1)} px` : '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">Mean |Timing Error|</p>
                  <p className="text-2xl font-black text-sp-text">
                    {results.length ? `${meanAbsTimingError.toFixed(0)} ms` : '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">Along Bias</p>
                  <p className="text-2xl font-black text-sp-text">
                    {results.length ? `${meanAlongBias.toFixed(1)} px` : '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">Lateral Bias</p>
                  <p className="text-2xl font-black text-sp-text">
                    {results.length ? `${meanLateralBias.toFixed(1)} px` : '-'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
              <h3 className="mb-3 text-xl font-black text-sp-text">
                วิธีเล่น
              </h3>

              <ul className="space-y-2 text-sm text-sp-text-muted">
                <li>• สังเกตทิศทางและความเร็วของเป้าหมาย</li>
                <li>• เมื่อเป้าหมายหายไป ให้คลิกตำแหน่งที่คาดว่าเป้าหมายจะอยู่</li>
                <li>• ระบบจะแสดงตำแหน่งจริงและเส้นความคลาดเคลื่อน</li>
                <li>• Prediction Error ยิ่งน้อยยิ่งดี</li>
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