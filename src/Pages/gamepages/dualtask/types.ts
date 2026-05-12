import type {
  DualTaskConfig,
  DualTaskDifficulty,
  MovementStage,
} from './constants'

export type GameStatus = 'idle' | 'playing' | 'finished'

export type Point = {
  x: number
  y: number
}

export type Target = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  maxSpeed: number
  phaseX: number
  phaseY: number

  waypointX: number
  waypointY: number
}

export type KeySequence = {
  id: string
  keys: string[]
  currentIndex: number
  startedAt: number
  expiresAt: number
}

export type DualTaskLiveStats = {
  timeLeftMs: number
  trackingAccuracy: number
  averageDistance: number
  inputAccuracy: number
  completedSequences: number
  wrongInputs: number
  avgInputReactionMs: number
  multitaskScore: number
}

export type DualTaskConfigSnapshot = Pick<
  DualTaskConfig,
  | 'label'
  | 'durationMs'
  | 'canvasWidth'
  | 'canvasHeight'
  | 'targetRadius'
  | 'targetBaseSpeed'
  | 'targetMaxSpeed'
  | 'sequenceSpawnDelayMs'
  | 'sequenceLifetimeMs'
  | 'minSequenceLength'
  | 'maxSequenceLength'
  | 'movementScheduleVersion'
> & {
  movementStages: MovementStage[]
}

export type DualTaskResult = {
  gameType: 'dual_task'
  sessionSeed: number
  durationMs: number

  difficultyMode: DualTaskDifficulty
  movementScheduleVersion: string
  configSnapshot: DualTaskConfigSnapshot

  trackingAccuracy: number
  averageDistance: number
  stability: number

  inputAccuracy: number
  completedSequences: number
  totalKeyInputs: number
  correctKeyInputs: number
  wrongKeyInputs: number
  avgInputReactionMs: number

  multitaskScore: number
  playedAt: string
}