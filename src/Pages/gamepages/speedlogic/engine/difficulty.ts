import { SPEED_LOGIC_CONFIG } from '../constants'

type DifficultyParams = {
  currentDifficulty: number
  currentStreak: number
  recentMistakes: number
  isCorrect: boolean
}

export function updateDifficulty({
  currentDifficulty,
  currentStreak,
  recentMistakes,
  isCorrect,
}: DifficultyParams): {
  nextDifficulty: number
  nextStreak: number
  nextRecentMistakes: number
} {
  if (isCorrect) {
    const nextStreak = currentStreak + 1

    if (nextStreak >= SPEED_LOGIC_CONFIG.streakToIncreaseDifficulty) {
      return {
        nextDifficulty: clampDifficulty(currentDifficulty + 1),
        nextStreak: 0,
        nextRecentMistakes: 0,
      }
    }

    return {
      nextDifficulty: currentDifficulty,
      nextStreak,
      nextRecentMistakes: 0,
    }
  }

  const nextRecentMistakes = recentMistakes + 1

  if (nextRecentMistakes >= SPEED_LOGIC_CONFIG.mistakesToDecreaseDifficulty) {
    return {
      nextDifficulty: clampDifficulty(currentDifficulty - 1),
      nextStreak: 0,
      nextRecentMistakes: 0,
    }
  }

  return {
    nextDifficulty: currentDifficulty,
    nextStreak: 0,
    nextRecentMistakes,
  }
}

function clampDifficulty(value: number): number {
  return Math.min(
    SPEED_LOGIC_CONFIG.maxDifficulty,
    Math.max(SPEED_LOGIC_CONFIG.minDifficulty, value),
  )
}