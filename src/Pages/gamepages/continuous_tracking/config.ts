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
      segmentDistance: {
        min: 190,
        max: 260,
      },
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
      segmentDistance: {
        min: 145,
        max: 210,
      },
      speed: {
        min: 165,
        max: 220,
      },
      turnAngleDeg: {
        min: 35,
        max: 100,
      },
      candidateCount: 24,
    },

    hard: {
      label: 'Hard',
      targetRadius: 31,
      safeMargin: 82,
      segmentDistance: {
        min: 115,
        max: 175,
      },
      speed: {
        min: 215,
        max: 285,
      },
      turnAngleDeg: {
        min: 55,
        max: 135,
      },
      candidateCount: 30,
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