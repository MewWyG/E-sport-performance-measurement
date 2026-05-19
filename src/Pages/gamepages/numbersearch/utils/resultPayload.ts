import type { GameResultPayload } from '../../../../types/gameResult'
import type { NumberSearchStats } from '../types'

type BuildNumberSearchResultPayloadParams = {
  stats: NumberSearchStats
  sessionId?: string | null
  playerId?: string | null
}

export function buildNumberSearchResultPayload({
  stats,
  sessionId = null,
  playerId = null,
}: BuildNumberSearchResultPayloadParams): GameResultPayload {
  const clickAccuracy = calculateClickAccuracy(
    stats.correctClicks,
    stats.wrongClicks,
  )

  return {
    session_id: sessionId,
    player_id: playerId,
    game_id: 'number-search',

    score: stats.score,

    accuracy: clickAccuracy,
    reaction_time_ms: stats.averageFindTime,
    duration_ms: Math.round(stats.elapsedMs),

    raw_data_json: {
      schemaVersion: 1,

      gameMode: 'standard',

      summary: {
        levelReached: stats.levelReached,
        completedLevels: stats.completedLevels,
        correctClicks: stats.correctClicks,
        wrongClicks: stats.wrongClicks,
        totalNumbersShown: stats.totalNumbersShown,
        clickAccuracy,
        averageFindTime: stats.averageFindTime,
        score: stats.score,
        durationMs: Math.round(stats.elapsedMs),
      },

      levelEvents: stats.levelEvents,
      targetEvents: stats.targetEvents,
      inputEvents: stats.inputEvents,
    },
  }
}

function calculateClickAccuracy(correctClicks: number, wrongClicks: number) {
  const totalClicks = correctClicks + wrongClicks

  if (totalClicks <= 0) {
    return 0
  }

  return Math.round((correctClicks / totalClicks) * 100)
}