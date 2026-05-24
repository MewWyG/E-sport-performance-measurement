import {
  NUMBER_SEARCH_GAME_ID,
  NUMBER_SEARCH_GAME_MODE,
  NUMBER_SEARCH_RESULT_SCHEMA_VERSION,
  PERCENT_SCALE,
} from '../config'
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
    game_id: NUMBER_SEARCH_GAME_ID,

    score: stats.score,

    accuracy: clickAccuracy,
    reaction_time_ms: stats.averageFindTime,
    duration_ms: Math.round(stats.elapsedMs),

    raw_data_json: {
      schemaVersion: NUMBER_SEARCH_RESULT_SCHEMA_VERSION,

      gameMode: NUMBER_SEARCH_GAME_MODE,

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

  return Math.round((correctClicks / totalClicks) * PERCENT_SCALE)
}