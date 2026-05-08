import type { Point } from '../types'

export class SeededRNG {
  private state: number

  constructor(seed = Date.now()) {
    this.state = seed >>> 0
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next()
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }
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

  if (normalized < 0) {
    normalized += range * 2
  }

  if (normalized <= range) {
    return min + normalized
  }

  return max - (normalized - range)
}