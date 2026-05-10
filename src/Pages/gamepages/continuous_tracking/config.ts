import type { Difficulty, DifficultyConfig } from './types'

export const CONTINUOUS_TRACKING_CONFIG = {
  canvas: {
    width: 1150,
    height: 720,
    arenaPadding: 42,
  },

  durationOptions: [20, 30, 45, 60],

  countdownSec: 3,

  target: {
    visualRingExtra: 14,
  },

  cursor: {
    radius: 7,
  },

  scoring: {
    centerPerfectRadius: 4,
  },

  difficulty: {
    easy: {
      label: 'Easy',
      targetRadius: 44,
      safeMargin: 90,

      /**
       * Easy ใช้ระยะที่ยาวและนิ่งกว่า
       * เปลี่ยนทิศทางไม่ถี่มาก จึงตามง่ายกว่า
       */
      distancePlan: [
        { min: 190, max: 210 },
        { min: 170, max: 190 },
        { min: 200, max: 230 },
        { min: 160, max: 180 },
        { min: 190, max: 215 },
        { min: 175, max: 200 },
      ],

      speed: {
        min: 105,
        max: 140,
      },

      turnAngleDeg: {
        min: 15,
        max: 45,
      },

      candidateCount: 18,
    },

    normal: {
      label: 'Normal',
      targetRadius: 35,
      safeMargin: 82,

      /**
       * Normal ระยะสั้นลงและหลากหลายขึ้น
       * เปลี่ยนทิศทางถี่กว่า Easy
       */
      distancePlan: [
        { min: 145, max: 165 },
        { min: 120, max: 145 },
        { min: 160, max: 190 },
        { min: 110, max: 135 },
        { min: 145, max: 170 },
        { min: 130, max: 155 },
        { min: 170, max: 205 },
      ],

      speed: {
        min: 165,
        max: 200,
      },

      turnAngleDeg: {
        min: 35,
        max: 100,
      },

      candidateCount: 24,
    },

    hard: {
      label: 'Hard',
      targetRadius: 27,
      safeMargin: 76,

      /**
       * Hard ระยะสั้นกว่า เปลี่ยนทิศบ่อยกว่า
       * ความเร็วสูงและมุมเลี้ยวแรงขึ้น
       */
      distancePlan: [
        { min: 110, max: 120 },
        { min: 105, max: 130 },
        { min: 140, max: 160 },
        { min: 120, max: 150 },
        { min: 90, max: 120 },
        { min: 110, max: 145 },
        { min: 120, max: 150 },
        { min: 125, max: 155 },
      ],

      speed: {
        min: 210,
        max: 250,
      },

      turnAngleDeg: {
        min: 55,
        max: 105,
      },

      candidateCount: 32,
    },
  } satisfies Record<Difficulty, DifficultyConfig>,

  colors: {
    background: '#020617',
    grid: 'rgba(148, 163, 184, 0.09)',
    border: 'rgba(148, 163, 184, 0.24)',

    target: '#22c55e',
    targetRing: 'rgba(34, 197, 94, 0.22)',
    targetCenter: '#bbf7d0',

    cursor: '#f8fafc',
    cursorStroke: 'rgba(15, 23, 42, 0.9)',

    text: '#e5e7eb',
    muted: '#94a3b8',
  },
} as const