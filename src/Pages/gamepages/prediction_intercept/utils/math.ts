import type { Point } from '../types'

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function formatMs(value: number): string {
  if (!Number.isFinite(value)) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(0)} ms`
}

export function reflectCoordinate(value: number, min: number, max: number): number {
  const range = max - min
  if (range <= 0) return min

  let normalized = (value - min) % (range * 2)
  if (normalized < 0) normalized += range * 2

  if (normalized <= range) {
    return min + normalized
  }

  return max - (normalized - range)
}