import { PREDICTION_CONFIG } from '../config'
import type {
  Difficulty,
  FeedbackState,
  GamePhase,
  TrialConfig,
  TrialResult,
} from '../types'
import { SeededRNG } from '../utils/math'
import { createTrial } from './PredictionMotion'
import {
  calculateTrialResult,
  createMissResult,
} from './PredictionScoring'

export class PredictionEngine {
  phase: GamePhase
  difficulty: Difficulty
  trialCount: number
  currentTrialIndex: number

  trial: TrialConfig | null
  feedback: FeedbackState | null
  results: TrialResult[]

  private rng: SeededRNG

  constructor() {
    this.phase = 'idle'
    this.difficulty = 'normal'
    this.trialCount = PREDICTION_CONFIG.trial.defaultTrialCount
    this.currentTrialIndex = 0

    this.trial = null
    this.feedback = null
    this.results = []

    this.rng = new SeededRNG()
  }

  reset(): void {
    this.phase = 'idle'
    this.currentTrialIndex = 0
    this.trial = null
    this.feedback = null
    this.results = []
    this.rng = new SeededRNG()
  }

  configure(options: {
    difficulty: Difficulty
    trialCount: number
  }): void {
    this.difficulty = options.difficulty
    this.trialCount = options.trialCount
    this.rng = new SeededRNG()
  }

  start(now: number): void {
    this.results = []
    this.currentTrialIndex = 1
    this.phase = 'observe'
    this.trial = createTrial(
      this.currentTrialIndex,
      now,
      this.difficulty,
      this.rng,
    )
    this.feedback = null
  }

  private startTrial(index: number, now: number): void {
    this.currentTrialIndex = index
    this.phase = 'observe'
    this.trial = createTrial(index, now, this.difficulty, this.rng)
    this.feedback = null
  }

  update(now: number): void {
    const trial = this.trial
    if (!trial) return

    if (this.phase === 'observe') {
      const elapsed = now - trial.startAt

      if (elapsed >= trial.observeMs) {
        trial.waitStartAt = now
        this.phase = 'wait'
      }

      return
    }

    if (this.phase === 'wait') {
      const elapsed = now - trial.waitStartAt

      if (elapsed >= trial.waitMs) {
        trial.clickableStartAt = now
        this.phase = 'clickable'
      }

      return
    }

    if (this.phase === 'clickable') {
      const elapsed = now - trial.clickableStartAt

      if (elapsed >= trial.clickWindowMs) {
        const result = createMissResult(trial, now)
        this.results.push(result)

        this.feedback = {
          until: now + PREDICTION_CONFIG.trial.feedbackMs,
          click: null,
          actual: result.actual,
          error: null,
          trialScore: 0,
          reactionTimeMs: null,
          responseLabel: result.responseLabel,
        }

        this.phase = 'feedback'
      }

      return
    }

    if (this.phase === 'feedback') {
      if (this.feedback && now >= this.feedback.until) {
        this.goNextTrial(now)
      }
    }
  }

  handleClick(click: { x: number; y: number }, now: number): void {
    const trial = this.trial
    if (!trial) return

    if (this.phase !== 'clickable') return

    const result = calculateTrialResult(trial, click, now)

    this.results.push(result)

    this.feedback = {
      until: now + PREDICTION_CONFIG.trial.feedbackMs,
      click,
      actual: result.actual,
      error: result.predictionError,
      trialScore: result.trialScore,
      reactionTimeMs: result.reactionTimeMs,
      responseLabel: result.responseLabel,
    }

    this.phase = 'feedback'
  }

  private goNextTrial(now: number): void {
    if (this.currentTrialIndex >= this.trialCount) {
      this.phase = 'finished'
      this.trial = null
      this.feedback = null
      return
    }

    this.startTrial(this.currentTrialIndex + 1, now)
  }
}