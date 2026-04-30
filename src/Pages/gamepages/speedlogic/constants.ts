export const SPEED_LOGIC_CONFIG = {
  durationMs: 60_000,

  initialDifficulty: 1,
  minDifficulty: 1,
  maxDifficulty: 10,

  answerChoiceCount: 4,

  streakToIncreaseDifficulty: 3,
  mistakesToDecreaseDifficulty: 2,

  minAnswerDelayMs: 150,
} as const

export const QUESTION_TYPES = [
  'addition',
  'subtraction',
  'multiplication',
  'comparison',
  'odd_even',
  'true_false',
] as const