export const QUESTION_TYPES = [
  'addition',
  'subtraction',
  'multiplication',
  'comparison',
  'odd_even',
  'true_false',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]

export type QuestionScheduleStage = {
  id: string
  startSec: number
  endSec: number
  allowedTypes: QuestionType[]
  minDifficulty: number
  maxDifficulty: number
}

export type SpeedLogicConfig = {
  label: string
  durationMs: number

  initialDifficulty: number
  minDifficulty: number
  maxDifficulty: number

  answerChoiceCount: number

  streakToIncreaseDifficulty: number
  mistakesToDecreaseDifficulty: number

  minAnswerDelayMs: number

  maxSameTypeStreak: number
  scheduleVersion: string
  questionStages: QuestionScheduleStage[]
}

export const SPEED_LOGIC_TEST_PRESETS = {
  easy: {
    label: 'Easy',
    durationMs: 60_000,

    initialDifficulty: 1,
    minDifficulty: 1,
    maxDifficulty: 5,

    answerChoiceCount: 4,

    streakToIncreaseDifficulty: 4,
    mistakesToDecreaseDifficulty: 2,

    minAnswerDelayMs: 150,

    maxSameTypeStreak: 2,
    scheduleVersion: 'speed_logic_easy_v2',
    questionStages: [
      {
        id: 'easy_0_15',
        startSec: 0,
        endSec: 15,
        allowedTypes: ['addition', 'comparison', 'odd_even'],
        minDifficulty: 1,
        maxDifficulty: 2,
      },
      {
        id: 'easy_15_35',
        startSec: 15,
        endSec: 35,
        allowedTypes: ['addition', 'subtraction', 'comparison', 'odd_even'],
        minDifficulty: 1,
        maxDifficulty: 3,
      },
      {
        id: 'easy_35_60',
        startSec: 35,
        endSec: 60,
        allowedTypes: ['addition', 'subtraction', 'comparison', 'odd_even'],
        minDifficulty: 2,
        maxDifficulty: 5,
      },
    ],
  },

  normal: {
    label: 'Normal',
    durationMs: 60_000,

    initialDifficulty: 1,
    minDifficulty: 1,
    maxDifficulty: 10,

    answerChoiceCount: 4,

    streakToIncreaseDifficulty: 3,
    mistakesToDecreaseDifficulty: 2,

    minAnswerDelayMs: 150,

    maxSameTypeStreak: 2,
    scheduleVersion: 'speed_logic_normal_v2',
    questionStages: [
      {
        id: 'normal_0_15',
        startSec: 0,
        endSec: 15,
        allowedTypes: ['addition', 'comparison', 'odd_even'],
        minDifficulty: 1,
        maxDifficulty: 3,
      },
      {
        id: 'normal_15_30',
        startSec: 15,
        endSec: 30,
        allowedTypes: ['addition', 'subtraction', 'comparison', 'odd_even'],
        minDifficulty: 2,
        maxDifficulty: 5,
      },
      {
        id: 'normal_30_45',
        startSec: 30,
        endSec: 45,
        allowedTypes: [
          'addition',
          'subtraction',
          'multiplication',
          'comparison',
          'odd_even',
        ],
        minDifficulty: 4,
        maxDifficulty: 7,
      },
      {
        id: 'normal_45_60',
        startSec: 45,
        endSec: 60,
        allowedTypes: [
          'addition',
          'subtraction',
          'multiplication',
          'comparison',
          'odd_even',
          'true_false',
        ],
        minDifficulty: 6,
        maxDifficulty: 10,
      },
    ],
  },

  hard: {
    label: 'Hard',
    durationMs: 60_000,

    initialDifficulty: 3,
    minDifficulty: 1,
    maxDifficulty: 10,

    answerChoiceCount: 4,

    streakToIncreaseDifficulty: 3,
    mistakesToDecreaseDifficulty: 3,

    minAnswerDelayMs: 150,

    maxSameTypeStreak: 2,
    scheduleVersion: 'speed_logic_hard_v2',
    questionStages: [
      {
        id: 'hard_0_15',
        startSec: 0,
        endSec: 15,
        allowedTypes: ['addition', 'subtraction', 'comparison', 'odd_even'],
        minDifficulty: 3,
        maxDifficulty: 5,
      },
      {
        id: 'hard_15_30',
        startSec: 15,
        endSec: 30,
        allowedTypes: [
          'addition',
          'subtraction',
          'multiplication',
          'comparison',
          'odd_even',
        ],
        minDifficulty: 5,
        maxDifficulty: 7,
      },
      {
        id: 'hard_30_45',
        startSec: 30,
        endSec: 45,
        allowedTypes: [
          'addition',
          'subtraction',
          'multiplication',
          'comparison',
          'odd_even',
          'true_false',
        ],
        minDifficulty: 7,
        maxDifficulty: 10,
      },
      {
        id: 'hard_45_60',
        startSec: 45,
        endSec: 60,
        allowedTypes: [
          'addition',
          'subtraction',
          'multiplication',
          'comparison',
          'odd_even',
          'true_false',
        ],
        minDifficulty: 8,
        maxDifficulty: 10,
      },
    ],
  },
} as const satisfies Record<string, SpeedLogicConfig>

export type SpeedLogicTestMode = keyof typeof SPEED_LOGIC_TEST_PRESETS

export const DEFAULT_SPEED_LOGIC_TEST_MODE: SpeedLogicTestMode = 'normal'

export const SPEED_LOGIC_CONFIG =
  SPEED_LOGIC_TEST_PRESETS[DEFAULT_SPEED_LOGIC_TEST_MODE]