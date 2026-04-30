import { PREDICTION_CONFIG } from '../config'
import type {
  FeedbackState,
  GamePhase,
  MotionMode,
  SpeedMode,
  TrialConfig,
  TrialResult,
} from '../types'
import { createTrial } from './PredictionMotion'

export type PredictionEngineState = {
  phase: GamePhase
  currentTrialIndex: number
  trial: TrialConfig | null
  feedback: FeedbackState | null
  results: TrialResult[]
}

export class PredictionEngine {
  phase: GamePhase
  currentTrialIndex: number
  trialCount: number
  motionMode: MotionMode
  speedMode: SpeedMode
  trial: TrialConfig | null
  feedback: FeedbackState | null
  results: TrialResult[]

  constructor() {
    this.phase = 'idle'
    this.currentTrialIndex = 0
    this.trialCount = PREDICTION_CONFIG.trial.defaultTrialCount
    this.motionMode = 'linear'
    this.speedMode = 'normal'
    this.trial = null
    this.feedback = null
    this.results = []
  }

  reset(): void {
    this.phase = 'idle'
    this.currentTrialIndex = 0
    this.trial = null
    this.feedback = null
    this.results = []
  }

  configure(options: {
    trialCount: number
    motionMode: MotionMode
    speedMode: SpeedMode
  }): void {
    this.trialCount = options.trialCount
    this.motionMode = options.motionMode
    this.speedMode = options.speedMode
  }

  start(now: number): TrialConfig {
    this.results = []
    this.currentTrialIndex = 1
    this.phase = 'visible'
    this.trial = createTrial(
      this.currentTrialIndex,
      now,
      this.motionMode,
      this.speedMode,
    )
    this.feedback = null

    return this.trial
  }

  startTrial(index: number, now: number): TrialConfig {
    this.currentTrialIndex = index
    this.phase = 'visible'
    this.trial = createTrial(index, now, this.motionMode, this.speedMode)
    this.feedback = null

    return this.trial
  }

  setPhase(phase: GamePhase): void {
    this.phase = phase
  }

  setHidden(now: number): void {
    if (!this.trial) return

    this.trial.hiddenStartAt = now
    this.phase = 'hidden'
  }

  setFeedback(feedback: FeedbackState): void {
    this.feedback = feedback
    this.phase = 'feedback'
  }

  addResult(result: TrialResult): void {
    this.results.push(result)
  }

  hasNextTrial(): boolean {
    return this.currentTrialIndex < this.trialCount
  }

  goNextTrial(now: number): TrialConfig | null {
    if (!this.hasNextTrial()) {
      this.phase = 'finished'
      this.trial = null
      this.feedback = null
      return null
    }

    return this.startTrial(this.currentTrialIndex + 1, now)
  }

  finish(): void {
    this.phase = 'finished'
    this.trial = null
    this.feedback = null
  }

  getState(): PredictionEngineState {
    return {
      phase: this.phase,
      currentTrialIndex: this.currentTrialIndex,
      trial: this.trial,
      feedback: this.feedback,
      results: this.results,
    }
  }
}