import {
  MOVING_TARGET_GAME_ID,
  RESULT_PAYLOAD_SCHEMA_VERSION,
  TOTAL_TARGETS,
} from '../config'
import type { MovingTargetStats } from '../types'
import type { GameResultPayload } from '../../../../types/gameResult'

type BuildMovingTargetResultPayloadParams = {
  stats: MovingTargetStats
  sessionId?: string | null
  playerId?: string | null
}

export function buildMovingTargetResultPayload({
  stats,
  sessionId = null,
  playerId = null,
}: BuildMovingTargetResultPayloadParams): GameResultPayload {
  return {
    session_id: sessionId,
    player_id: playerId,
    game_id: MOVING_TARGET_GAME_ID,

    // ตอนนี้ใช้ accuracy เป็น score หลักของ Moving Target
    score: stats.accuracy,

    accuracy: stats.accuracy,
    reaction_time_ms: stats.averageResponseTime,
    duration_ms: Math.round(stats.elapsedMs),

    raw_data_json: {
      schemaVersion: RESULT_PAYLOAD_SCHEMA_VERSION,

      gameMode: stats.mode,
      totalTargets: TOTAL_TARGETS,
      spawnedTargetCount: stats.spawnedTargetCount,

      summary: {
        hits: stats.hits,
        misses: stats.misses,
        wrongClicks: stats.wrongClicks,
        accuracy: stats.accuracy,
        averageResponseTime: stats.averageResponseTime,
        durationMs: Math.round(stats.elapsedMs),
      },

      targetEvents: stats.targetEvents,
      inputEvents: stats.inputEvents,
    },
  }
}