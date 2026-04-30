import { PREDICTION_CONFIG } from '../config'
import type {
  FeedbackState,
  GamePhase,
  SpeedMode,
  TrialConfig,
  TrialResult,
} from '../types'
import { SeededRNG } from '../utils/math'
import { createTrial } from './PredictionMotion'

export class PredictionEngine {
  phase: GamePhase
  currentTrialIndex: number
  trialCount: number
  speedMode: SpeedMode
  seed: number
  rng: SeededRNG
  trial: TrialConfig | null
  feedback: FeedbackState | null
  results: TrialResult[]

  constructor() {
    this.phase = 'idle'
    this.currentTrialIndex = 0
    this.trialCount = PREDICTION_CONFIG.trial.defaultTrialCount
    this.speedMode = 'normal'
    this.seed = PREDICTION_CONFIG.seed.defaultSeed
    this.rng = new SeededRNG(this.seed)
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
    speedMode: SpeedMode
    seed: number
  }): void {
    this.trialCount = options.trialCount
    this.speedMode = options.speedMode
    this.seed = options.seed
    this.rng = new SeededRNG(options.seed)
  }

  start(now: number): TrialConfig {
    this.results = []
    this.currentTrialIndex = 1
    this.phase = 'visible'
    this.trial = createTrial(
      this.currentTrialIndex,
      now,
      this.speedMode,
      this.rng,
    )
    this.feedback = null

    return this.trial
  }

  startTrial(index: number, now: number): TrialConfig {
    this.currentTrialIndex = index
    this.phase = 'visible'
    this.trial = createTrial(index, now, this.speedMode, this.rng)
    this.feedback = null

    return this.trial
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
}