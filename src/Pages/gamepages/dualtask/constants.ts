export type MovementStage = {
  startSec: number
  endSec: number
  movementRadius: number
  speedMultiplier: number
  accelerationMultiplier: number
  directionChangeRate: number
}

export type DualTaskConfig = {
  label: string
  durationMs: number

  canvasWidth: number
  canvasHeight: number

  targetRadius: number
  targetBaseSpeed: number
  targetMaxSpeed: number

  sequenceSpawnDelayMs: number
  sequenceLifetimeMs: number

  minSequenceLength: number
  maxSequenceLength: number

  movementScheduleVersion: string
  movementStages: MovementStage[]
}

export const DUAL_TASK_DIFFICULTY_PRESETS = {
  easy: {
    label: 'Easy',
    durationMs: 60_000,

    canvasWidth: 900,
    canvasHeight: 520,

    targetRadius: 34,
    targetBaseSpeed: 150,
    targetMaxSpeed: 260,

    sequenceSpawnDelayMs: 2_800,
    sequenceLifetimeMs: 4_000,

    minSequenceLength: 2,
    maxSequenceLength: 4,

    movementScheduleVersion: 'dual_task_easy_v2',
    movementStages: [
      {
        startSec: 0,
        endSec: 10,
        movementRadius: 40,
        speedMultiplier: 0.5,
        accelerationMultiplier: 0.45,
        directionChangeRate: 0.7,
      },
      {
        startSec: 10,
        endSec: 25,
        movementRadius: 90,
        speedMultiplier: 0.65,
        accelerationMultiplier: 0.6,
        directionChangeRate: 0.8,
      },
      {
        startSec: 25,
        endSec: 45,
        movementRadius: 170,
        speedMultiplier: 0.8,
        accelerationMultiplier: 0.75,
        directionChangeRate: 0.9,
      },
      {
        startSec: 45,
        endSec: 60,
        movementRadius: 280,
        speedMultiplier: 0.95,
        accelerationMultiplier: 0.9,
        directionChangeRate: 1,
      },
    ],
  },

  normal: {
    label: 'Normal',
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

    movementScheduleVersion: 'dual_task_normal_v2',
    movementStages: [
      {
        startSec: 0,
        endSec: 5,
        movementRadius: 55,
        speedMultiplier: 0.55,
        accelerationMultiplier: 0.55,
        directionChangeRate: 0.8,
      },
      {
        startSec: 5,
        endSec: 15,
        movementRadius: 110,
        speedMultiplier: 0.75,
        accelerationMultiplier: 0.75,
        directionChangeRate: 0.9,
      },
      {
        startSec: 15,
        endSec: 30,
        movementRadius: 190,
        speedMultiplier: 1,
        accelerationMultiplier: 1,
        directionChangeRate: 1,
      },
      {
        startSec: 30,
        endSec: 45,
        movementRadius: 290,
        speedMultiplier: 1.15,
        accelerationMultiplier: 1.15,
        directionChangeRate: 1.15,
      },
      {
        startSec: 45,
        endSec: 60,
        movementRadius: 9999,
        speedMultiplier: 1.25,
        accelerationMultiplier: 1.25,
        directionChangeRate: 1.25,
      },
    ],
  },

  hard: {
    label: 'Hard',
    durationMs: 60_000,

    canvasWidth: 900,
    canvasHeight: 520,

    targetRadius: 20,
    targetBaseSpeed: 230,
    targetMaxSpeed: 400,

    sequenceSpawnDelayMs: 2_000,
    sequenceLifetimeMs: 2_700,

    minSequenceLength: 4,
    maxSequenceLength: 7,

    movementScheduleVersion: 'dual_task_hard_v2',
    movementStages: [
      {
        startSec: 0,
        endSec: 5,
        movementRadius: 100,
        speedMultiplier: 0.8,
        accelerationMultiplier: 0.85,
        directionChangeRate: 1,
      },
      {
        startSec: 5,
        endSec: 15,
        movementRadius: 200,
        speedMultiplier: 1,
        accelerationMultiplier: 1.05,
        directionChangeRate: 1.1,
      },
      {
        startSec: 15,
        endSec: 30,
        movementRadius: 320,
        speedMultiplier: 1.2,
        accelerationMultiplier: 1.25,
        directionChangeRate: 1.25,
      },
      {
        startSec: 30,
        endSec: 45,
        movementRadius: 9999,
        speedMultiplier: 1.35,
        accelerationMultiplier: 1.4,
        directionChangeRate: 1.4,
      },
      {
        startSec: 45,
        endSec: 60,
        movementRadius: 9999,
        speedMultiplier: 1.5,
        accelerationMultiplier: 1.55,
        directionChangeRate: 1.55,
      },
    ],
  },
} as const satisfies Record<string, DualTaskConfig>

export type DualTaskDifficulty = keyof typeof DUAL_TASK_DIFFICULTY_PRESETS

export const DEFAULT_DUAL_TASK_DIFFICULTY: DualTaskDifficulty = 'normal'

export const DUAL_TASK_CONFIG =
  DUAL_TASK_DIFFICULTY_PRESETS[DEFAULT_DUAL_TASK_DIFFICULTY]

export const AVAILABLE_KEYS = ['W', 'A', 'S', 'D', 'Q', 'E', 'R', 'X'] as const