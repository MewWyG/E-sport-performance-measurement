import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { PREDICTION_CONFIG } from './config'
import { PredictionEngine } from './engine/PredictionEngine'
import {
  getPathGuidePoints,
  getTargetPosition,
} from './engine/PredictionMotion'
import { calculatePredictionSummary } from './engine/PredictionScoring'
import type {
  Difficulty,
  GamePhase,
  Point,
  PredictionSummary,
  TrialResult,
} from './types'

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

function getScoreLabel(score: number): string {
  if (score >= 85) return 'คาดการณ์ได้ดีมาก'
  if (score >= 70) return 'คาดการณ์ได้ดี'
  if (score >= 50) return 'พอใช้'
  return 'ควรฝึกเพิ่ม'
}

export function PredictionInterceptGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const engineRef = useRef(new PredictionEngine())

  const [phase, setPhase] = useState<GamePhase>('idle')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [trialCount, setTrialCount] = useState<number>(
    PREDICTION_CONFIG.trial.defaultTrialCount,
  )
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [summary, setSummary] = useState<PredictionSummary | null>(null)
  const [statusText, setStatusText] = useState('กดเริ่มทดสอบเพื่อเริ่มเกม')
  const [countdownValue, setCountdownValue] = useState<number | null>(null)

  const isRunning =
    countdownValue !== null ||
    phase === 'observe' ||
    phase === 'wait' ||
    phase === 'clickable' ||
    phase === 'feedback'

  const phaseLabel: Record<GamePhase, string> = {
    idle: 'พร้อม',
    countdown: 'เตรียมพร้อม',
    observe: 'กำลังสังเกต',
    wait: 'รอสัญญาณ',
    clickable: 'คลิกได้',
    feedback: 'เฉลยตำแหน่ง',
    finished: 'เสร็จสิ้น',
  }

  function syncFromEngine(): void {
    const engine = engineRef.current
    setPhase(engine.phase)
    setCurrentTrialIndex(engine.currentTrialIndex)
    setResults([...engine.results])
    setSummary(calculatePredictionSummary(engine.results))
  }

  function stopLoop(): void {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  function clearCountdownTimer(): void {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  function getBackgroundColor(currentPhase: GamePhase): string {
    if (currentPhase === 'observe') return '#0b3b63'
    if (currentPhase === 'wait') return '#0b3b63'
    if (currentPhase === 'clickable') return '#0f4d2f'
    if (currentPhase === 'feedback') return '#021126'
    return '#021126'
  }

  function getArenaBorderColor(currentPhase: GamePhase): string {
    if (currentPhase === 'observe') return 'rgba(125, 211, 252, 0.75)'
    if (currentPhase === 'wait') return 'rgba(125, 211, 252, 0.9)'
    if (currentPhase === 'clickable') return 'rgba(74, 222, 128, 0.95)'
    if (currentPhase === 'feedback') return 'rgba(203, 213, 225, 0.45)'
    return 'rgba(203, 213, 225, 0.35)'
  }

  function drawGrid(
    ctx: CanvasRenderingContext2D,
    currentPhase: GamePhase,
  ): void {
    const { width, height, margin } = PREDICTION_CONFIG.canvas
    const colors = PREDICTION_CONFIG.colors

    ctx.save()

    ctx.fillStyle = getBackgroundColor(currentPhase)
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

    ctx.strokeStyle = getArenaBorderColor(currentPhase)
    ctx.lineWidth = currentPhase === 'clickable' ? 5 : 3
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2)

    if (currentPhase === 'clickable') {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)'
      ctx.lineWidth = 14
      ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2)
    }

    if (currentPhase === 'observe' || currentPhase === 'wait') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)'
      ctx.lineWidth = 14
      ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2)
    }

    ctx.restore()
  }

  function drawGuidePath(ctx: CanvasRenderingContext2D): void {
  const trial = engineRef.current.trial
  if (!trial) return

  const { width, height, margin } = PREDICTION_CONFIG.canvas
  const points = getPathGuidePoints(trial, trial.totalMotionMs, 40)

  if (points.length < 2) return

  ctx.save()

  ctx.beginPath()
  ctx.rect(margin, margin, width - margin * 2, height - margin * 2)
  ctx.clip()

  ctx.strokeStyle = PREDICTION_CONFIG.colors.pathGuide
  ctx.lineWidth = 2.5
  ctx.setLineDash([10, 8])

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  ctx.stroke()
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

  function drawInstructionText(
    ctx: CanvasRenderingContext2D,
    currentPhase: GamePhase,
  ): void {
    ctx.save()
    ctx.fillStyle = PREDICTION_CONFIG.colors.text
    ctx.font = 'bold 24px sans-serif'

    if (currentPhase === 'observe') {
      ctx.fillText('สนามสีฟ้า: สังเกตทิศทางและความเร็วของเป้าหมาย', 32, 42)
    } else if (currentPhase === 'wait') {
      ctx.fillText('สนามสีฟ้า: เป้าหมายหายไปแล้ว รอสัญญาณสีเขียว', 32, 42)
    } else if (currentPhase === 'clickable') {
      ctx.fillText('สนามสีเขียว: คลิกตำแหน่งที่คิดว่าเป้าจะอยู่', 32, 42)
    } else if (currentPhase === 'idle') {
      ctx.fillStyle = PREDICTION_CONFIG.colors.muted
      ctx.fillText('กดเริ่มทดสอบเพื่อเริ่มเกม', 32, 42)
    }

    ctx.restore()
  }

  function drawFeedback(ctx: CanvasRenderingContext2D): void {
    const feedback = engineRef.current.feedback
    if (!feedback || !feedback.actual) return

    drawTarget(ctx, feedback.actual)

    if (feedback.click) {
      drawClick(ctx, feedback.click)

      ctx.save()
      ctx.strokeStyle = PREDICTION_CONFIG.colors.errorLine
      ctx.lineWidth = 2
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      ctx.moveTo(feedback.click.x, feedback.click.y)
      ctx.lineTo(feedback.actual.x, feedback.actual.y)
      ctx.stroke()
      ctx.restore()
    }

    ctx.save()
    ctx.fillStyle = PREDICTION_CONFIG.colors.text
    ctx.font = 'bold 22px sans-serif'

    const reactionText =
      feedback.reactionTimeMs !== null
        ? ` • Reaction: ${feedback.reactionTimeMs.toFixed(0)} ms`
        : ''

    const text =
      feedback.error !== null && Number.isFinite(feedback.error)
        ? `Error: ${feedback.error.toFixed(1)} px • Score: ${
            feedback.trialScore ?? 0
          }${reactionText}`
        : feedback.responseLabel

    ctx.fillText(text, 32, 42)
    ctx.restore()
  }

  function drawPhaseBadge(
    ctx: CanvasRenderingContext2D,
    currentPhase: GamePhase,
  ): void {
    const { width } = PREDICTION_CONFIG.canvas

    let label = ''
    let bg = '#0f172a'

    if (currentPhase === 'observe') {
      label = `Trial ${engineRef.current.currentTrialIndex}/${trialCount} • สังเกต`
      bg = 'rgba(14, 116, 144, 0.9)'
    } else if (currentPhase === 'wait') {
      label = `Trial ${engineRef.current.currentTrialIndex}/${trialCount} • รอสีเขียว`
      bg = 'rgba(14, 116, 144, 0.95)'
    } else if (currentPhase === 'clickable') {
      label = `Trial ${engineRef.current.currentTrialIndex}/${trialCount} • คลิกได้`
      bg = 'rgba(22, 101, 52, 0.95)'
    } else if (currentPhase === 'feedback') {
      label = `Trial ${engineRef.current.currentTrialIndex}/${trialCount} • เฉลย`
      bg = 'rgba(15, 23, 42, 0.86)'
    } else if (currentPhase === 'finished') {
      label = `Trial ${trialCount}/${trialCount} • เสร็จสิ้น`
      bg = 'rgba(15, 23, 42, 0.86)'
    }

    if (!label) return

    ctx.save()
    ctx.font = 'bold 16px sans-serif'

    const textWidth = ctx.measureText(label).width
    const pillWidth = textWidth + 28
    const pillHeight = 42
    const x = width - pillWidth - 24
    const y = 24
    const radius = 21

    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + pillWidth - radius, y)
    ctx.quadraticCurveTo(x + pillWidth, y, x + pillWidth, y + radius)
    ctx.lineTo(x + pillWidth, y + pillHeight - radius)
    ctx.quadraticCurveTo(
      x + pillWidth,
      y + pillHeight,
      x + pillWidth - radius,
      y + pillHeight,
    )
    ctx.lineTo(x + radius, y + pillHeight)
    ctx.quadraticCurveTo(x, y + pillHeight, x, y + pillHeight - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1.2
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + 14, y + pillHeight / 2)
    ctx.restore()
  }

  function renderStatic(): void {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGrid(ctx, 'idle')
    drawInstructionText(ctx, 'idle')
  }

  function updateStatusText(currentPhase: GamePhase): void {
    if (currentPhase === 'observe') {
      setStatusText('สนามสีฟ้า: สังเกตเป้าหมายที่วิ่งตามเส้นประ')
    } else if (currentPhase === 'wait') {
      setStatusText('สนามสีฟ้า: เป้าหมายหายไปแล้ว รอให้สนามเป็นสีเขียว')
    } else if (currentPhase === 'clickable') {
      setStatusText('สนามสีเขียว: คลิกตำแหน่งที่คาดว่าเป้าอยู่ได้')
    } else if (currentPhase === 'feedback') {
      setStatusText('เฉลยตำแหน่งจริงและคะแนนของรอบนี้')
    } else if (currentPhase === 'finished') {
      setStatusText('จบการทดสอบแล้ว')
    }
  }

  function renderFrame(now: number): void {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const engine = engineRef.current

    engine.update(now)

    const currentPhase = engine.phase

    syncFromEngine()

    drawGrid(ctx, currentPhase)

    if (engine.trial) {
      drawGuidePath(ctx)
    }

    if (engine.trial && currentPhase === 'observe') {
      const target = getTargetPosition(engine.trial, now - engine.trial.startAt)
      drawTarget(ctx, target)
    }

    if (currentPhase === 'feedback') {
      drawFeedback(ctx)
    } else {
      drawInstructionText(ctx, currentPhase)
    }

    drawPhaseBadge(ctx, currentPhase)

    if (currentPhase === 'finished') {
      stopLoop()
      updateStatusText(currentPhase)
      return
    }

    updateStatusText(currentPhase)
    frameRef.current = requestAnimationFrame(renderFrame)
  }

  function startActualGame(): void {
    const engine = engineRef.current

    engine.configure({
      difficulty,
      trialCount,
    })

    engine.start(performance.now())

    setSummary(null)
    setResults([])
    setStatusText('เริ่มการทดสอบ')
    syncFromEngine()

    stopLoop()
    frameRef.current = requestAnimationFrame(renderFrame)
  }

  function startGame(): void {
    const engine = engineRef.current

    clearCountdownTimer()
    stopLoop()
    engine.reset()

    setSummary(null)
    setResults([])
    setCurrentTrialIndex(0)
    setPhase('countdown')
    setStatusText('เตรียมพร้อม เริ่มในอีก 3 วินาที')
    renderStatic()

    let count = PREDICTION_CONFIG.trial.countdownSec
    setCountdownValue(count)

    countdownTimerRef.current = window.setInterval(() => {
      count -= 1

      if (count > 0) {
        setCountdownValue(count)
        setStatusText(`เตรียมพร้อม เริ่มในอีก ${count} วินาที`)
        return
      }

      clearCountdownTimer()
      setCountdownValue(null)
      startActualGame()
    }, 1000)
  }

  function resetGame(): void {
    const engine = engineRef.current

    clearCountdownTimer()
    stopLoop()
    engine.reset()

    setCountdownValue(null)
    setSummary(null)
    setResults([])
    setCurrentTrialIndex(0)
    setStatusText('กดเริ่มทดสอบเพื่อเริ่มเกม')
    syncFromEngine()
    renderStatic()
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>): void {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = engineRef.current

    if (engine.phase !== 'clickable') return

    const click = getCanvasPoint(canvas, e)
    engine.handleClick(click, performance.now())

    syncFromEngine()
  }

  useEffect(() => {
    renderStatic()

    return () => {
      clearCountdownTimer()
      stopLoop()
    }
  }, [])

  const averageTrialScore =
    results.length > 0 && summary ? summary.totalScore / results.length : 0

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[108rem] flex-grow px-4 py-8 md:px-6">
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
            สังเกตเป้าหมายที่เคลื่อนที่ตามเส้นประ เมื่อสนามเปลี่ยนเป็นสีเขียว
            ให้คลิกตำแหน่งที่คิดว่าเป้าจะอยู่
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

            <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
              <p className="text-sm text-sp-text-muted">สถานะ</p>
              <p className="text-2xl font-black text-sp-text">
                {countdownValue !== null ? 'Countdown' : phaseLabel[phase]}
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

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_330px]">
          <section className="rounded-3xl border border-sp-border bg-sp-card p-4 shadow-sp-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-sp-text">
                  พื้นที่ทดสอบ
                </h2>

                <p className="text-sm text-sp-text-muted">{statusText}</p>
              </div>

              <div className="rounded-full border border-sp-border bg-sp-bg px-4 py-2 text-sm font-bold text-sp-text">
                Trial {currentTrialIndex || 0}/{trialCount} •{' '}
                {countdownValue !== null ? 'เตรียมพร้อม' : phaseLabel[phase]}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-sp-border bg-black">
              <canvas
                ref={canvasRef}
                width={PREDICTION_CONFIG.canvas.width}
                height={PREDICTION_CONFIG.canvas.height}
                className="block h-auto w-full cursor-crosshair"
                onClick={handleCanvasClick}
              />

              {countdownValue !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-sm">
                  <div className="mb-3 text-lg font-bold text-sp-text-muted">
                    เตรียมพร้อม
                  </div>

                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-sp-border bg-sp-primary text-6xl font-black text-white shadow-sp-brand">
                    {countdownValue}
                  </div>

                  <div className="mt-4 text-sm font-bold text-sp-text-muted">
                    เริ่มทดสอบหลังนับถอยหลัง
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
                  <p className="text-sm text-sp-text-muted">Total Score</p>
                  <p className="text-3xl font-black text-sp-text">
                    {summary ? summary.totalScore : '-'}
                  </p>

                  <p className="mt-1 text-sm font-bold text-sp-primary">
                    {summary ? getScoreLabel(averageTrialScore) : ''}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    ความแม่นยำตำแหน่ง
                  </p>

                  <p className="text-2xl font-black text-sp-text">
                    {summary ? `${summary.positionAccuracy.toFixed(0)}%` : '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    ระยะพลาดเฉลี่ย
                  </p>

                  <p className="text-2xl font-black text-sp-text">
                    {summary && summary.completedTrials > 0
                      ? `${summary.meanPredictionError.toFixed(1)} px`
                      : '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    ความแม่นยำด้านจังหวะ
                  </p>

                  <p className="text-2xl font-black text-sp-text">
                    {summary ? `${summary.timingAccuracy.toFixed(0)}%` : '-'}
                  </p>

                  <p className="mt-1 text-xs text-sp-text-muted">
                    คิดจากความเร็วหลังสนามเป็นสีเขียว
                  </p>
                </div>

                <div className="rounded-2xl border border-sp-border bg-sp-bg p-4">
                  <p className="text-sm text-sp-text-muted">
                    ความเร็วหลังสีเขียว
                  </p>

                  <p className="text-2xl font-black text-sp-text">
                    {summary && summary.completedTrials > 0
                      ? `${summary.meanReactionTimeMs.toFixed(0)} ms`
                      : '-'}
                  </p>

                  <p className="mt-1 text-xs text-sp-text-muted">
                    ยิ่งคลิกเร็วหลังสนามเป็นสีเขียว ยิ่งได้คะแนนจังหวะสูง
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-sp-border bg-sp-card p-5 shadow-sp-card">
              <h3 className="mb-3 text-xl font-black text-sp-text">
                วิธีเล่น
              </h3>

              <ul className="space-y-2 text-sm text-sp-text-muted">
                <li>• สนามสีฟ้า = สังเกตหรือรอ ยังไม่ให้คลิก</li>
                <li>• สนามสีเขียว = ถึงเวลาคลิกตำแหน่งที่คิดว่าเป้าอยู่</li>
                <li>• เส้นประคือเส้นทางจริงที่เป้าหมายเคลื่อนที่ตาม</li>
                <li>• Easy มีเวลาสังเกตและเวลาคลิกมากกว่า</li>
                <li>• Hard เป้าเร็วกว่า และช่วงคลิกสั้นกว่า</li>
                <li>• ทุกโหมดใช้สูตรคะแนนเดียวกัน</li>
                <li>• คะแนนสูงเมื่อคลิกใกล้ตำแหน่งจริงและคลิกเร็วหลังสีเขียว</li>
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