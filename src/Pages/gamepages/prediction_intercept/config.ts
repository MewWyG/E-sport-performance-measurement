export const PREDICTION_CONFIG = {
  canvas: {
    width: 1000,
    height: 640,
    margin: 64,
  },

  target: {
    radius: 18,
    ringRadius: 32,
  },

  trial: {
    defaultTrialCount: 8,
    visibleMsRange: [1200, 1600],
    occlusionMsRange: [450, 700],
    noResponseGraceMs: 1200,
    feedbackMs: 900,
  },

  speed: {
    slow: 160,
    normal: 210,
    fast: 260,
  },

  seed: {
    defaultSeed: 20260422,
    maxRandomSeed: 2147483647,
  },

  colors: {
    background: '#020617',
    grid: 'rgba(148, 163, 184, 0.09)',
    border: 'rgba(148, 163, 184, 0.22)',
    target: '#22c55e',
    targetRing: 'rgba(34, 197, 94, 0.2)',
    click: '#f97316',
    errorLine: 'rgba(248, 113, 113, 0.9)',
    guideLine: 'rgba(96, 165, 250, 0.18)',
    text: '#e5e7eb',
    muted: '#94a3b8',
  },
} as const