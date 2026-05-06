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
  return {
    session_id: sessionId,
    player_id: playerId,
    game_id: 'number-search',

    score: stats.score,

    // Number Search เวอร์ชันนี้ไม่ใช้ accuracy เป็น metric หลัก
    // ใส่ 0 ไว้เพื่อให้ตรงกับ GameResultPayload เดิม
    accuracy: 0,

    reaction_time_ms: stats.averageFindTime,
    duration_ms: Math.round(stats.elapsedMs),

    raw_data_json: {
      levelReached: stats.levelReached,
      completedLevels: stats.completedLevels,
      correctClicks: stats.correctClicks,
      wrongClicks: stats.wrongClicks,
      totalNumbersShown: stats.totalNumbersShown,
      averageFindTime: stats.averageFindTime,
      score: stats.score,
      durationMs: Math.round(stats.elapsedMs),
    },
  }
}