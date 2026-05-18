/**
 * Internal Game Module Contract
 * ใช้ภายในเกมเพื่อ encapsulate state — converted to GameResultPayload
 * (ของระบบหลัก SkillPulse) ก่อนส่งออกผ่าน window event.
 */

export const GAME_RESULT_SCHEMA_VERSION = "1.0.0" as const;
export type GameResultSchemaVersion = typeof GAME_RESULT_SCHEMA_VERSION;
export type GameStatus = "completed" | "aborted" | "failed";
export type GameConfig = Record<string, unknown>;
export type GameRawData = Record<string, unknown>;

export interface GameResult {
  schemaVersion: GameResultSchemaVersion;
  gameId: string;
  gameName: string;
  playerId: string;
  sessionId: string;
  status: GameStatus;
  score: number;
  accuracy?: number;
  reactionTimeMs?: number;
  responseTimesMs?: number[];
  startedAt: string;
  endedAt: string;
  durationMs: number;
  config?: GameConfig;
  rawData: GameRawData;
}

export interface GameProps {
  playerId: string;
  sessionId: string;
  onGameComplete: (result: GameResult) => void;
}
