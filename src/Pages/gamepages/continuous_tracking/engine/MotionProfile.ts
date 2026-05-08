import type { MovementSegment, Point } from '../types'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function getSegmentPosition(
  segment: MovementSegment,
  elapsedMs: number,
): Point {
  const t = clamp(elapsedMs / segment.durationMs, 0, 1)

  return {
    x: lerp(segment.start.x, segment.end.x, t),
    y: lerp(segment.start.y, segment.end.y, t),
  }
}

export function isSegmentFinished(
  segment: MovementSegment,
  elapsedMs: number,
): boolean {
  return elapsedMs >= segment.durationMs
}