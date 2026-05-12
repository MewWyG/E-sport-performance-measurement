import { SPEED_LOGIC_CONFIG } from '../constants'
import type { SpeedLogicConfig } from '../constants'
import type { AnswerChoice, QuestionType, SpeedLogicQuestion } from '../types'
import type { Rng } from './rng'
import { randomInt, shuffleArray } from './rng'

type GenerateQuestionParams = {
  rng: Rng
  difficulty: number
  questionCount: number
  now: number
  questionType: QuestionType
  scheduleStageId: string
  config?: SpeedLogicConfig
}

export function generateQuestion({
  rng,
  difficulty,
  questionCount,
  now,
  questionType,
  scheduleStageId,
  config = SPEED_LOGIC_CONFIG,
}: GenerateQuestionParams): SpeedLogicQuestion {
  switch (questionType) {
    case 'addition':
      return generateAdditionQuestion({
        rng,
        difficulty,
        questionCount,
        now,
        scheduleStageId,
        config,
      })

    case 'subtraction':
      return generateSubtractionQuestion({
        rng,
        difficulty,
        questionCount,
        now,
        scheduleStageId,
        config,
      })

    case 'multiplication':
      return generateMultiplicationQuestion({
        rng,
        difficulty,
        questionCount,
        now,
        scheduleStageId,
        config,
      })

    case 'comparison':
      return generateComparisonQuestion({
        rng,
        difficulty,
        questionCount,
        now,
        scheduleStageId,
      })

    case 'odd_even':
      return generateOddEvenQuestion({
        rng,
        difficulty,
        questionCount,
        now,
        scheduleStageId,
      })

    case 'true_false':
      return generateTrueFalseQuestion({
        rng,
        difficulty,
        questionCount,
        now,
        scheduleStageId,
      })

    default:
      return generateAdditionQuestion({
        rng,
        difficulty,
        questionCount,
        now,
        scheduleStageId,
        config,
      })
  }
}

type QuestionFactoryParams = {
  rng: Rng
  difficulty: number
  questionCount: number
  now: number
  scheduleStageId: string
  config?: SpeedLogicConfig
}

function generateAdditionQuestion({
  rng,
  difficulty,
  questionCount,
  now,
  scheduleStageId,
  config = SPEED_LOGIC_CONFIG,
}: QuestionFactoryParams): SpeedLogicQuestion {
  const max = 8 + difficulty * 8
  const a = randomInt(rng, 1, max)
  const b = randomInt(rng, 1, max)
  const answer = a + b

  return buildNumericQuestion({
    rng,
    id: createQuestionId(now, questionCount),
    type: 'addition',
    prompt: `${a} + ${b} = ?`,
    correctAnswer: answer,
    difficulty,
    now,
    scheduleStageId,
    config,
  })
}

function generateSubtractionQuestion({
  rng,
  difficulty,
  questionCount,
  now,
  scheduleStageId,
  config = SPEED_LOGIC_CONFIG,
}: QuestionFactoryParams): SpeedLogicQuestion {
  const max = 10 + difficulty * 10
  const a = randomInt(rng, 5, max)
  const b = randomInt(rng, 1, a)
  const answer = a - b

  return buildNumericQuestion({
    rng,
    id: createQuestionId(now, questionCount),
    type: 'subtraction',
    prompt: `${a} - ${b} = ?`,
    correctAnswer: answer,
    difficulty,
    now,
    scheduleStageId,
    config,
  })
}

function generateMultiplicationQuestion({
  rng,
  difficulty,
  questionCount,
  now,
  scheduleStageId,
  config = SPEED_LOGIC_CONFIG,
}: QuestionFactoryParams): SpeedLogicQuestion {
  const maxA = Math.min(12, 3 + difficulty)
  const maxB = Math.min(12, 3 + difficulty)

  const a = randomInt(rng, 2, maxA)
  const b = randomInt(rng, 2, maxB)
  const answer = a * b

  return buildNumericQuestion({
    rng,
    id: createQuestionId(now, questionCount),
    type: 'multiplication',
    prompt: `${a} × ${b} = ?`,
    correctAnswer: answer,
    difficulty,
    now,
    scheduleStageId,
    config,
  })
}

function generateComparisonQuestion({
  rng,
  difficulty,
  questionCount,
  now,
  scheduleStageId,
}: QuestionFactoryParams): SpeedLogicQuestion {
  const max = 10 + difficulty * 12

  const left = randomInt(rng, 1, max)
  let right = randomInt(rng, 1, max)

  while (left === right) {
    right = randomInt(rng, 1, max)
  }

  const correctValue = left > right ? left : right

  const choices: AnswerChoice[] = [
    {
      id: 'left',
      label: `${left}`,
      value: left,
    },
    {
      id: 'right',
      label: `${right}`,
      value: right,
    },
  ]

  return {
    id: createQuestionId(now, questionCount),
    type: 'comparison',
    prompt: 'เลขไหนมากกว่า?',
    choices,
    correctChoiceId: correctValue === left ? 'left' : 'right',
    difficulty,
    createdAt: now,
    scheduleStageId,
  }
}

function generateOddEvenQuestion({
  rng,
  difficulty,
  questionCount,
  now,
  scheduleStageId,
}: QuestionFactoryParams): SpeedLogicQuestion {
  const max = 20 + difficulty * 15
  const value = randomInt(rng, 1, max)
  const isEven = value % 2 === 0

  const choices: AnswerChoice[] = [
    {
      id: 'even',
      label: 'เลขคู่',
      value: true,
    },
    {
      id: 'odd',
      label: 'เลขคี่',
      value: false,
    },
  ]

  return {
    id: createQuestionId(now, questionCount),
    type: 'odd_even',
    prompt: `${value} เป็นเลขอะไร?`,
    choices,
    correctChoiceId: isEven ? 'even' : 'odd',
    difficulty,
    createdAt: now,
    scheduleStageId,
  }
}

function generateTrueFalseQuestion({
  rng,
  difficulty,
  questionCount,
  now,
  scheduleStageId,
}: QuestionFactoryParams): SpeedLogicQuestion {
  const max = 10 + difficulty * 8
  const a = randomInt(rng, 1, max)
  const b = randomInt(rng, 1, max)
  const actualAnswer = a + b

  const shouldBeTrue = randomInt(rng, 0, 1) === 1

  const shownAnswer = shouldBeTrue
    ? actualAnswer
    : actualAnswer + randomInt(rng, 1, Math.max(2, difficulty + 1))

  const choices: AnswerChoice[] = [
    {
      id: 'true',
      label: 'ถูก',
      value: true,
    },
    {
      id: 'false',
      label: 'ผิด',
      value: false,
    },
  ]

  return {
    id: createQuestionId(now, questionCount),
    type: 'true_false',
    prompt: `${a} + ${b} = ${shownAnswer}`,
    choices,
    correctChoiceId: shouldBeTrue ? 'true' : 'false',
    difficulty,
    createdAt: now,
    scheduleStageId,
  }
}

type BuildNumericQuestionParams = {
  rng: Rng
  id: string
  type: QuestionType
  prompt: string
  correctAnswer: number
  difficulty: number
  now: number
  scheduleStageId: string
  config: SpeedLogicConfig
}

function buildNumericQuestion({
  rng,
  id,
  type,
  prompt,
  correctAnswer,
  difficulty,
  now,
  scheduleStageId,
  config,
}: BuildNumericQuestionParams): SpeedLogicQuestion {
  const choices = createNumericChoices(rng, correctAnswer, difficulty, config)

  return {
    id,
    type,
    prompt,
    choices,
    correctChoiceId:
      choices.find((choice) => choice.value === correctAnswer)?.id ?? '',
    difficulty,
    createdAt: now,
    scheduleStageId,
  }
}

function createNumericChoices(
  rng: Rng,
  correctAnswer: number,
  difficulty: number,
  config: SpeedLogicConfig,
): AnswerChoice[] {
  const values = new Set<number>()
  values.add(correctAnswer)

  const spread = Math.max(3, difficulty * 2)

  while (values.size < config.answerChoiceCount) {
    const offset = randomInt(rng, -spread, spread)

    if (offset === 0) continue

    const candidate = correctAnswer + offset

    if (candidate < 0) continue

    values.add(candidate)
  }

  const shuffledValues = shuffleArray(rng, Array.from(values))

  return shuffledValues.map((value, index) => ({
    id: `choice-${index}`,
    label: `${value}`,
    value,
  }))
}

function createQuestionId(now: number, questionCount: number): string {
  return `${Math.floor(now)}-${questionCount}`
}