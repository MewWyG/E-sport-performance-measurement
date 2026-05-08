import type { Difficulty, DifficultyConfig } from './types'

export const PREDICTION_CONFIG = {
  canvas: {
    width: 1350,
    height: 820,
    margin: 70,
  },

  target: {
    radius: 18,
    ringRadius: 32,
  },

  trial: {
    defaultTrialCount: 8,
    feedbackMs: 950,
    countdownSec: 3,
  },

  difficulty: {
    easy: {
      label: 'Easy',
      speed: {
        min: 140,
        max: 190,
      },
      observeMs: {
        min: 1500,
        max: 1900,
      },
      waitMs: {
        min: 450,
        max: 650,
      },
      clickWindowMs: 1400,
      slopeOptions: [-0.08, 0, 0.08],
    },

    normal: {
      label: 'Normal',
      speed: {
        min: 190,
        max: 260,
      },
      observeMs: {
        min: 1250,
        max: 1650,
      },
      waitMs: {
        min: 550,
        max: 800,
      },
      clickWindowMs: 1150,
      slopeOptions: [-0.14, -0.07, 0, 0.07, 0.14],
    },

    hard: {
      label: 'Hard',
      speed: {
        min: 250,
        max: 330,
      },
      observeMs: {
        min: 1000,
        max: 1350,
      },
      waitMs: {
        min: 700,
        max: 950,
      },
      clickWindowMs: 900,
      slopeOptions: [-0.2, -0.13, -0.06, 0.06, 0.13, 0.2],
    },
  } satisfies Record<Difficulty, DifficultyConfig>,

  scoring: {
    perfectErrorPx: 12,
    maxScoreErrorPx: 150,

    perfectReactionMs: 120,
    maxReactionMs: 900,

    positionWeight: 0.75,
    timingWeight: 0.25,

    maxScorePerTrial: 100,
  },

  colors: {
    observeBackground: '#0b3b63',
    waitBackground: '#0b3b63',
    clickableBackground: '#0f4d2f',
    feedbackBackground: '#021126',

    grid: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(203, 213, 225, 0.28)',

    target: '#22c55e',
    targetRing: 'rgba(34, 197, 94, 0.22)',

    click: '#f97316',
    actual: '#22c55e',
    errorLine: 'rgba(248, 113, 113, 0.92)',

    pathGuide: 'rgba(125, 211, 252, 0.65)',

    text: '#e5e7eb',
    muted: '#94a3b8',
  },
} as const