import { SPEED_LOGIC_CONFIG } from '../constants'
import type { SpeedLogicConfig } from '../constants'

type DifficultyParams = {
  currentDifficulty: number
  currentStreak: number
  recentMistakes: number
  isCorrect: boolean
  config?: SpeedLogicConfig
  stageMinDifficulty?: number
  stageMaxDifficulty?: number
}

export function updateDifficulty({
  currentDifficulty,
  currentStreak,
  recentMistakes,
  isCorrect,
  config = SPEED_LOGIC_CONFIG,
  stageMinDifficulty,
  stageMaxDifficulty,
}: DifficultyParams): {
  nextDifficulty: number
  nextStreak: number
  nextRecentMistakes: number
} {
  const minDifficulty = stageMinDifficulty ?? config.minDifficulty
  const maxDifficulty = stageMaxDifficulty ?? config.maxDifficulty

  if (isCorrect) {
    const nextStreak = currentStreak + 1

    if (nextStreak >= config.streakToIncreaseDifficulty) {
      return {
        nextDifficulty: clampDifficulty(
          currentDifficulty + 1,
          minDifficulty,
          maxDifficulty,
        ),
        nextStreak: 0,
        nextRecentMistakes: 0,
      }
    }

    return {
      nextDifficulty: clampDifficulty(
        currentDifficulty,
        minDifficulty,
        maxDifficulty,
      ),
      nextStreak,
      nextRecentMistakes: 0,
    }
  }

  const nextRecentMistakes = recentMistakes + 1

  if (nextRecentMistakes >= config.mistakesToDecreaseDifficulty) {
    return {
      nextDifficulty: clampDifficulty(
        currentDifficulty - 1,
        minDifficulty,
        maxDifficulty,
      ),
      nextStreak: 0,
      nextRecentMistakes: 0,
    }
  }

  return {
    nextDifficulty: clampDifficulty(
      currentDifficulty,
      minDifficulty,
      maxDifficulty,
    ),
    nextStreak: 0,
    nextRecentMistakes,
  }
}

export function clampDifficulty(
  value: number,
  minDifficulty: number,
  maxDifficulty: number,
): number {
  return Math.min(maxDifficulty, Math.max(minDifficulty, value))
}