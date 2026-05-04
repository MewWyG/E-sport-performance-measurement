import { TOTAL_TARGETS } from '../config'
import type { Difficulty } from '../types'

export function getDifficulty(hitCount: number): Difficulty {
  const targetNumber = hitCount + 1

  if (targetNumber <= 10) {
    return {
      size: 76,
      speed: 0.07,
      lifetime: 2500,
      decoyCount: 0,
      pattern: 'straight',
      label: 'พื้นฐาน',
    }
  }

  if (targetNumber <= 20) {
    return {
      size: 72,
      speed: 0.13,
      lifetime: 2150,
      decoyCount: 0,
      pattern: 'bounce',
      label: 'เร็วขึ้น',
    }
  }

  if (targetNumber <= 25) {
    return {
      size: 48,
      speed: 0.17,
      lifetime: 1700,
      decoyCount: 0,
      pattern: targetNumber % 2 === 0 ? 'bounce' : 'random',
      label: 'แม่นยำ',
    }
  }

  if (targetNumber <= 35) {
    return {
      size: 48,
      speed: 0.17,
      lifetime: 1650,
      decoyCount: 1,
      pattern: 'bounce',
      label: 'เป้าหลอก 1',
    }
  }

  if (targetNumber <= 45) {
    return {
      size: 42,
      speed: 0.19,
      lifetime: 1500,
      decoyCount: 2,
      pattern: 'random',
      label: 'เป้าหลอก 2',
    }
  }

  return {
    size: 38,
    speed: 0.21,
    lifetime: 1350,
    decoyCount: 3,
    pattern: 'random',
    label: 'ท้าทาย',
  }
}