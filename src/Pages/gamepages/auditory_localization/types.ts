/** Internal types ของเกม Auditory Localization & Reaction */

export type SoundType = "footstep" | "reload";

export interface Point {
  x: number;
  y: number;
}

export interface Trial {
  index: number;
  /** 0 = ขวา, 90 = ล่าง, 180 = ซ้าย, 270 = บน */
  angleDeg: number;
  /** 0 = ใกล้/ดัง, 1 = ไกล/เบา */
  distance: number;
  soundType: SoundType;
  playedAt: number;
  clickedAt?: number;
  clickAngleDeg?: number;
  /** ระยะคลิกจากจุดกลางเรดาร์ (normalized 0-1) */
  clickDistance?: number;
  angleErrorDeg?: number;
  /** ระยะห่างระหว่างจุดที่คลิกกับเป้าจริง (normalized 0-1) */
  positionalError?: number;
  reactionMs?: number;
  success?: boolean;
  timedOut?: boolean;
}

export interface RevealInfo {
  trueAngle: number;
  trueDistance: number;
  clickAngle: number | null;
  clickDistance: number | null;
  /** angle error เป็นองศา */
  error: number | null;
  /** positional error normalized 0-1 (ใช้ตัดสิน success) */
  positionalError: number | null;
  success: boolean;
  timedOut: boolean;
}

/** rawData ที่จะถูกส่งใน GameResult.rawData */
export interface AuditoryRawData extends Record<string, unknown> {
  totalTrials: number;
  successCount: number;
  missedCount: number;
  wrongCount: number;
  avgAngleErrorDeg: number;
  avgPositionalError: number;
  avgDistanceError: number;
  successRateNear: number;
  successRateMid: number;
  successRateFar: number;
  trials: Array<{
    index: number;
    angleDeg: number;
    clickAngleDeg: number | null;
    angleErrorDeg: number | null;
    distance: number;
    clickDistance: number | null;
    positionalError: number | null;
    reactionMs: number | null;
    soundType: SoundType;
    success: boolean | null;
    timedOut: boolean;
  }>;
}
