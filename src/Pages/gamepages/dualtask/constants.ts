export const DUAL_TASK_CONFIG = {
  durationMs: 60_000,

  canvasWidth: 900,
  canvasHeight: 520,

  targetRadius: 26,
  targetBaseSpeed: 190,
  targetMaxSpeed: 330,

  sequenceSpawnDelayMs: 2_400,
  sequenceLifetimeMs: 3_200,

  minSequenceLength: 3,
  maxSequenceLength: 6,
} as const

export const AVAILABLE_KEYS = ['W', 'A', 'S', 'D', 'Q', 'E', 'R', 'X'] as const