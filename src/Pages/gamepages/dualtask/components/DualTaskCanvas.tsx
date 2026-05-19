import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { Point, Target } from '../types'

type DualTaskCanvasProps = {
  targetRef: MutableRefObject<Target>
  pointerRef: MutableRefObject<Point>
  canvasWidth: number
  canvasHeight: number
  onPointerMove: (point: Point) => void
}

export function DualTaskCanvas({
  targetRef,
  pointerRef,
  canvasWidth,
  canvasHeight,
  onPointerMove,
}: DualTaskCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderFrameRef = useRef<number | null>(null)

  useEffect(() => {
    function render() {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      const bg = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
      bg.addColorStop(0, '#020617')
      bg.addColorStop(0.55, '#0f172a')
      bg.addColorStop(1, '#111827')

      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      drawGrid(ctx, canvasWidth, canvasHeight)

      const target = targetRef.current
      const pointer = pointerRef.current

      const dx = pointer.x - target.x
      const dy = pointer.y - target.y
      const distance = Math.hypot(dx, dy)
      const isOnTarget = distance <= target.radius

      drawTarget(ctx, target, isOnTarget)
      drawPointer(ctx, pointer, isOnTarget)
      drawDistanceLine(ctx, pointer, target, isOnTarget)

      renderFrameRef.current = requestAnimationFrame(render)
    }

    renderFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current)
      }
    }
  }, [canvasHeight, canvasWidth, pointerRef, targetRef])

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    const scaleX = canvasWidth / rect.width
    const scaleY = canvasHeight / rect.height

    onPointerMove({
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    })
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onPointerMove={handlePointerMove}
      className="block h-auto w-full cursor-crosshair bg-sp-bg-soft"
    />
  )
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save()

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)'
  ctx.lineWidth = 1

  for (let x = 0; x <= width; x += 45) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += 45) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.restore()
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: Target,
  isOnTarget: boolean,
) {
  ctx.save()

  const glowColor = isOnTarget
    ? 'rgba(52, 211, 153, 0.28)'
    : 'rgba(96, 165, 250, 0.22)'

  const mainColor = isOnTarget ? '#34d399' : '#60a5fa'

  ctx.beginPath()
  ctx.arc(target.x, target.y, target.radius + 14, 0, Math.PI * 2)
  ctx.fillStyle = glowColor
  ctx.fill()

  ctx.beginPath()
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)
  ctx.fillStyle = mainColor
  ctx.fill()

  ctx.beginPath()
  ctx.arc(target.x, target.y, target.radius * 0.55, 0, Math.PI * 2)
  ctx.fillStyle = '#020617'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(target.x, target.y, target.radius * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = mainColor
  ctx.fill()

  ctx.restore()
}

function drawPointer(
  ctx: CanvasRenderingContext2D,
  pointer: Point,
  isOnTarget: boolean,
) {
  ctx.save()

  ctx.beginPath()
  ctx.arc(pointer.x, pointer.y, 7, 0, Math.PI * 2)
  ctx.fillStyle = isOnTarget ? '#f8fafc' : '#fb7185'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(pointer.x, pointer.y, 13, 0, Math.PI * 2)
  ctx.strokeStyle = isOnTarget
    ? 'rgba(248, 250, 252, 0.5)'
    : 'rgba(251, 113, 133, 0.5)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}

function drawDistanceLine(
  ctx: CanvasRenderingContext2D,
  pointer: Point,
  target: Target,
  isOnTarget: boolean,
) {
  ctx.save()

  ctx.beginPath()
  ctx.moveTo(pointer.x, pointer.y)
  ctx.lineTo(target.x, target.y)
  ctx.strokeStyle = isOnTarget
    ? 'rgba(52, 211, 153, 0.28)'
    : 'rgba(251, 113, 133, 0.22)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 8])
  ctx.stroke()

  ctx.restore()
}