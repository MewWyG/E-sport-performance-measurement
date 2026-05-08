import { CONTINUOUS_TRACKING_CONFIG } from '../config'
import type { ContinuousTrackingMetrics, Point } from '../types'

export type ScoreSample = {
  error: number
  centerScore: number
  isOnTarget: boolean
  dt: number
}

export function getDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function calculateCenterScore(
  cursor: Point,
  target: Point,
  targetRadius: number,
): {
  error: number
  centerScore: number
  isOnTarget: boolean
} {
  const error = getDistance(cursor, target)
  const perfectRadius = CONTINUOUS_TRACKING_CONFIG.scoring.centerPerfectRadius

  if (error <= perfectRadius) {
    return {
      error,
      centerScore: 1,
      isOnTarget: true,
    }
  }

  if (error >= targetRadius) {
    return {
      error,
      centerScore: 0,
      isOnTarget: false,
    }
  }

  const normalized =
    1 - (error - perfectRadius) / (targetRadius - perfectRadius)

  return {
    error,
    centerScore: Math.max(0, Math.min(1, normalized)),
    isOnTarget: true,
  }
}

export function calculateMetrics(samples: ScoreSample[]): ContinuousTrackingMetrics {
  if (samples.length === 0) {
    return {
      trackingAccuracy: 0,
      timeOnTargetPercent: 0,
      meanError: 0,
      maxError: 0,
      totalScore: 0,
      totalTimeSec: 0,
    }
  }

  const totalTime = samples.reduce((sum, sample) => sum + sample.dt, 0)

  const weightedCenterScore = samples.reduce(
    (sum, sample) => sum + sample.centerScore * sample.dt,
    0,
  )

  const onTargetTime = samples.reduce(
    (sum, sample) => sum + (sample.isOnTarget ? sample.dt : 0),
    0,
  )

  const errorSum = samples.reduce((sum, sample) => sum + sample.error, 0)
  const maxError = Math.max(...samples.map((sample) => sample.error))

  const centerAccuracy =
    totalTime > 0 ? (weightedCenterScore / totalTime) * 100 : 0

  const timeOnTargetPercent =
    totalTime > 0 ? (onTargetTime / totalTime) * 100 : 0

  /**
   * คะแนนรวมเน้นความแม่นตรงกลางเป้า
   * อยู่บนเป้าอย่างเดียวช่วยให้ Time on Target สูง
   * แต่ถ้าอยากได้ Total Score สูง ต้องคุมให้อยู่ใกล้กึ่งกลางเป้าด้วย
   */
  const totalScore = Math.round(centerAccuracy * 10)

  return {
    trackingAccuracy: centerAccuracy,
    timeOnTargetPercent,
    meanError: errorSum / samples.length,
    maxError,
    totalScore,
    totalTimeSec: totalTime,
  }
}