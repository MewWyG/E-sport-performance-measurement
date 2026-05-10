import { CONTINUOUS_TRACKING_CONFIG } from '../config'
import type {
  ContinuousTrackingMetrics,
  Difficulty,
  EngineCallbacks,
  EngineStartOptions,
  EngineUpdate,
  MovementSegment,
  Point,
  TrialState,
} from '../types'
import { getSegmentPosition, isSegmentFinished } from './MotionProfile'
import {
  createInitialTargetPosition,
  generateNextSegment,
  SeededRNG,
  SegmentDistancePlanner,
} from './PathGenerator'
import {
  calculateCenterScore,
  calculateMetrics,
  type ScoreSample,
} from './Scoring'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function generateInternalSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1
}

export class ContinuousTrackingEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private callbacks: EngineCallbacks

  private rng: SeededRNG
  private distancePlanner: SegmentDistancePlanner

  private difficulty: Difficulty
  private durationSec: number
  private state: TrialState

  private target: Point
  private cursor: Point

  private segment: MovementSegment | null
  private previousAngle: number | null
  private segmentStartTime: number
  private startTime: number
  private lastFrameTime: number
  private frameId: number | null
  private samples: ScoreSample[]
  private metrics: ContinuousTrackingMetrics | null
  private liveAccuracy: number

  private handleDocumentMouseMove: (e: MouseEvent) => void
  private handlePointerLockChange: () => void

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks = {}) {
    this.canvas = canvas

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Cannot get 2D context from canvas')
    }

    this.ctx = ctx
    this.callbacks = callbacks

    this.rng = new SeededRNG()
    this.distancePlanner = new SegmentDistancePlanner('normal', this.rng)

    this.difficulty = 'normal'
    this.durationSec = 30
    this.state = 'idle'

    this.target = {
      x: CONTINUOUS_TRACKING_CONFIG.canvas.width / 2,
      y: CONTINUOUS_TRACKING_CONFIG.canvas.height / 2,
    }

    this.cursor = {
      x: CONTINUOUS_TRACKING_CONFIG.canvas.width / 2,
      y: CONTINUOUS_TRACKING_CONFIG.canvas.height / 2,
    }

    this.segment = null
    this.previousAngle = null
    this.segmentStartTime = 0
    this.startTime = 0
    this.lastFrameTime = 0
    this.frameId = null
    this.samples = []
    this.metrics = null
    this.liveAccuracy = 0

    this.handleDocumentMouseMove = (e: MouseEvent) => {
      this.handlePointerMove(e)
    }

    this.handlePointerLockChange = () => {
      if (
        this.state === 'running' &&
        document.pointerLockElement !== this.canvas
      ) {
        this.finish()
      }
    }

    document.addEventListener('mousemove', this.handleDocumentMouseMove)
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)

    this.renderStatic()
  }

  dispose(): void {
    this.stopLoop()

    document.removeEventListener('mousemove', this.handleDocumentMouseMove)
    document.removeEventListener(
      'pointerlockchange',
      this.handlePointerLockChange,
    )

    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }
  }

  setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks
  }

  setCursorFromClientPoint(clientX: number, clientY: number): void {
    if (document.pointerLockElement === this.canvas) return

    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    this.cursor = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }

    if (this.state !== 'running') {
      this.renderStatic()
    }
  }

  start(options: EngineStartOptions): void {
    this.stopLoop()

    this.difficulty = options.difficulty
    this.durationSec = options.durationSec
    this.state = 'running'

    const internalSeed = generateInternalSeed()
    this.rng = new SeededRNG(internalSeed)
    this.distancePlanner.reset(this.difficulty, this.rng)

    this.target = createInitialTargetPosition(this.rng)
    this.cursor = {
      x: this.target.x,
      y: this.target.y,
    }

    this.segment = null
    this.previousAngle = null
    this.samples = []
    this.metrics = null
    this.liveAccuracy = 0
    this.lastFrameTime = 0

    const now = performance.now()
    this.startTime = now
    this.createNewSegment(now)

    this.canvas.requestPointerLock?.()

    this.emitUpdate(this.durationSec)
    this.frameId = requestAnimationFrame((timestamp) =>
      this.renderFrame(timestamp),
    )
  }

  reset(): void {
    this.stopLoop()

    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }

    this.state = 'idle'
    this.rng = new SeededRNG()
    this.distancePlanner.reset('normal', this.rng)

    this.target = {
      x: CONTINUOUS_TRACKING_CONFIG.canvas.width / 2,
      y: CONTINUOUS_TRACKING_CONFIG.canvas.height / 2,
    }

    this.cursor = {
      x: CONTINUOUS_TRACKING_CONFIG.canvas.width / 2,
      y: CONTINUOUS_TRACKING_CONFIG.canvas.height / 2,
    }

    this.segment = null
    this.previousAngle = null
    this.samples = []
    this.metrics = null
    this.liveAccuracy = 0
    this.lastFrameTime = 0

    this.emitUpdate(0)
    this.renderStatic()
  }

  renderStatic(): void {
    this.drawGrid()
    this.drawTarget(this.target)
    this.drawCursor(this.cursor)

    this.ctx.save()
    this.ctx.fillStyle = CONTINUOUS_TRACKING_CONFIG.colors.muted
    this.ctx.font = 'bold 24px sans-serif'
    this.ctx.fillText('กดเริ่มทดสอบเพื่อเริ่มเกม', 32, 42)
    this.ctx.restore()
  }

  private handlePointerMove(e: MouseEvent): void {
    if (document.pointerLockElement !== this.canvas) return

    const { width, height } = CONTINUOUS_TRACKING_CONFIG.canvas

    this.cursor = {
      x: clamp(this.cursor.x + e.movementX, 0, width),
      y: clamp(this.cursor.y + e.movementY, 0, height),
    }
  }

  private stopLoop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  private emitUpdate(timeLeft: number): void {
    const update: EngineUpdate = {
      state: this.state,
      timeLeft,
      liveAccuracy: this.liveAccuracy,
      metrics: this.metrics,
    }

    this.callbacks.onUpdate?.(update)
  }

  private createNewSegment(now: number): void {
    const distancePx = this.distancePlanner.nextDistance()

    const nextSegment = generateNextSegment(
      this.target,
      this.previousAngle,
      this.difficulty,
      this.rng,
      distancePx,
    )

    this.segment = nextSegment
    this.segmentStartTime = now
    this.previousAngle = nextSegment.angle
  }

  private updateTarget(now: number): void {
    if (!this.segment) {
      this.createNewSegment(now)
      return
    }

    const elapsed = now - this.segmentStartTime

    this.target = getSegmentPosition(this.segment, elapsed)

    if (isSegmentFinished(this.segment, elapsed)) {
      this.target = this.segment.end
      this.createNewSegment(now)
    }
  }

  private renderFrame(now: number): void {
    if (this.state !== 'running') return

    const elapsedSec = (now - this.startTime) / 1000
    const remaining = Math.max(0, this.durationSec - elapsedSec)

    if (remaining <= 0) {
      this.finish()
      return
    }

    const dt =
      this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0

    this.lastFrameTime = now

    this.updateTarget(now)

    const difficultyConfig =
      CONTINUOUS_TRACKING_CONFIG.difficulty[this.difficulty]

    const score = calculateCenterScore(
      this.cursor,
      this.target,
      difficultyConfig.targetRadius,
    )

    if (dt > 0 && dt < 0.1) {
      this.samples.push({
        error: score.error,
        centerScore: score.centerScore,
        isOnTarget: score.isOnTarget,
        dt,
      })

      const currentMetrics = calculateMetrics(this.samples)
      this.liveAccuracy = currentMetrics.trackingAccuracy
    }

    this.drawGrid()
    this.drawTarget(this.target)
    this.drawCursor(this.cursor)

    this.emitUpdate(remaining)

    this.frameId = requestAnimationFrame((timestamp) =>
      this.renderFrame(timestamp),
    )
  }

  private finish(): void {
    if (this.state !== 'running') return

    this.stopLoop()

    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }

    this.metrics = calculateMetrics(this.samples)
    this.liveAccuracy = this.metrics.trackingAccuracy
    this.state = 'finished'

    this.emitUpdate(0)
    this.callbacks.onFinish?.(this.metrics)

    this.drawGrid()
    this.drawTarget(this.target)
    this.drawCursor(this.cursor)
  }

  private drawGrid(): void {
    const { width, height, arenaPadding } = CONTINUOUS_TRACKING_CONFIG.canvas
    const colors = CONTINUOUS_TRACKING_CONFIG.colors

    this.ctx.save()

    this.ctx.fillStyle = colors.background
    this.ctx.fillRect(0, 0, width, height)

    this.ctx.strokeStyle = colors.grid
    this.ctx.lineWidth = 1

    for (let x = 0; x <= width; x += 50) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, height)
      this.ctx.stroke()
    }

    for (let y = 0; y <= height; y += 50) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(width, y)
      this.ctx.stroke()
    }

    this.ctx.strokeStyle = colors.border
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(
      arenaPadding,
      arenaPadding,
      width - arenaPadding * 2,
      height - arenaPadding * 2,
    )

    this.ctx.restore()
  }

  private drawTarget(target: Point): void {
    const colors = CONTINUOUS_TRACKING_CONFIG.colors
    const radius =
      CONTINUOUS_TRACKING_CONFIG.difficulty[this.difficulty].targetRadius

    this.ctx.save()

    this.ctx.fillStyle = colors.targetRing
    this.ctx.beginPath()
    this.ctx.arc(
      target.x,
      target.y,
      radius + CONTINUOUS_TRACKING_CONFIG.target.visualRingExtra,
      0,
      Math.PI * 2,
    )
    this.ctx.fill()

    this.ctx.fillStyle = colors.target
    this.ctx.beginPath()
    this.ctx.arc(target.x, target.y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = colors.targetCenter
    this.ctx.beginPath()
    this.ctx.arc(target.x, target.y, 5, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()
  }

  private drawCursor(cursor: Point): void {
    const colors = CONTINUOUS_TRACKING_CONFIG.colors
    const radius = CONTINUOUS_TRACKING_CONFIG.cursor.radius

    this.ctx.save()

    this.ctx.fillStyle = colors.cursor
    this.ctx.strokeStyle = colors.cursorStroke
    this.ctx.lineWidth = 2

    this.ctx.beginPath()
    this.ctx.arc(cursor.x, cursor.y, radius, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()

    this.ctx.restore()
  }
}