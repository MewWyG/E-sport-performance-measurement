import { TOTAL_TARGETS } from '../config'
import type { Difficulty } from '../types'

export function getDifficulty(hitCount: number): Difficulty {
  const progress = Math.min(hitCount / (TOTAL_TARGETS - 1), 1)

  if (hitCount < 10) {
    return {
      size: 72 - progress * 10,
      speed: 0.08,
      lifetime: 2300,
      decoyCount: 0,
      pattern: 'straight',
      label: 'พื้นฐาน',
    }
  }

  if (hitCount < 20) {
    return {
      size: 58 - progress * 16,
      speed: 0.13,
      lifetime: 1850,
      decoyCount: 0,
      pattern: 'bounce',
      label: 'ปานกลาง',
    }
  }

  if (hitCount < 26) {
    return {
      size: 46 - progress * 10,
      speed: 0.17,
      lifetime: 1500,
      decoyCount: 1,
      pattern: 'bounce',
      label: 'ยาก',
    }
  }

  return {
    size: 38,
    speed: 0.22,
    lifetime: 1250,
    decoyCount: 2,
    pattern: 'random',
    label: 'ท้าทาย',
  }
}