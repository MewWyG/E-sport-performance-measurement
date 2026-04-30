export const PREDICTION_CONFIG = {
  canvas: {
    width: 1000,
    height: 640,
    margin: 48,
  },

  target: {
    radius: 18,
    ringRadius: 32,
  },

  trial: {
    defaultTrialCount: 8,
    visibleMsRange: [950, 1500],
    occlusionMsRange: [300, 800],
    noResponseGraceMs: 1500,
    feedbackMs: 900,
  },

  speed: {
    slow: 170,
    normal: 230,
    fast: 300,
  },

  acceleration: {
    min: 50,
    max: 110,
  },

  curve: {
    amplitudeRange: [45, 95],
    frequencyRange: [0.7, 1.15],
  },

  colors: {
    background: '#020617',
    grid: 'rgba(148, 163, 184, 0.09)',
    border: 'rgba(148, 163, 184, 0.22)',
    target: '#22c55e',
    targetRing: 'rgba(34, 197, 94, 0.2)',
    click: '#f97316',
    errorLine: 'rgba(248, 113, 113, 0.9)',
    text: '#e5e7eb',
    muted: '#94a3b8',
  },
} as const