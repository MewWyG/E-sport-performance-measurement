import type { GameResult } from "../../../../shared/gameModule";
import type { GameResultPayload } from "../../../../types/gameResult";

export function buildAuditoryResultPayload(result: GameResult): GameResultPayload {
  return {
    game_id: "auditory-localization",
    session_id: result.sessionId ?? null,
    player_id: result.playerId ?? null,
    score: Number(result.score.toFixed(2)),
    accuracy: Number((result.accuracy ?? 0).toFixed(2)),
    reaction_time_ms: Math.round(result.reactionTimeMs ?? 0),
    duration_ms: Math.round(result.durationMs),
    raw_data_json: result.rawData,
  };
}
