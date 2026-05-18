import {
  RefObject,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GAME_RESULT_SCHEMA_VERSION,
  GameResult,
  GameStatus,
} from "../../../../shared/gameModule";

import {
  AudioBundle,
  ensureAudioReady,
  playSpatialSound,
} from "../engine/audio";
import { sfx } from "../../../../shared/sfx";
import { AuditoryRawData, Point, RevealInfo, SoundType, Trial } from "../types";

export const GAME_ID = "auditory-localization";
export const GAME_NAME = "Auditory Localization & Reaction";

export interface AuditoryGameConfig extends Record<string, unknown> {
  trials: number;
  /** ระยะคลาดเคลื่อนแบบ normalized (0-1) ที่ยังถือว่าสำเร็จ */
  successThresholdDist: number;
  /** เก็บไว้เพื่อ backwards compatibility — แสดงเป็น threshold มุม */
  successThresholdDeg: number;
  responseTimeoutMs: number;
}

export interface ResultMeta {
  playerId: string;
  sessionId: string;
  status: GameStatus;
  startedAtIso: string;
  endedAtIso: string;
  durationMs: number;
  config: AuditoryGameConfig;
}

export interface UseAuditoryOptions {
  trials: number;
  successThresholdDeg: number;
  successThresholdDist?: number;
  responseTimeoutMs: number;
  playerId: string;
  sessionId: string;
  onGameComplete: (result: GameResult) => void;
}

const PRE_DELAY_MIN_MS = 700;
const PRE_DELAY_MAX_MS = 1450;
const REVEAL_DURATION_MS = 1200;
/** ระยะ normalized (0-1) ที่ถือว่าคลิกถูกเป้า ถ้าไม่ระบุ
 *  ค่ามากขึ้น = forgiving มากขึ้น (ผิดได้กว้างขึ้น)
 *  0.18 = strict / 0.28 = balanced / 0.35 = easy
 */
const DEFAULT_SUCCESS_DIST = 0.28;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomAngle(): number {
  return Math.floor(Math.random() * 360);
}

/** สุ่มมุมที่ห่างจาก lastAngle อย่างน้อย minSeparationDeg เพื่อกันรอบติด ๆ ที่มุมใกล้กัน */
function randomAngleAvoiding(lastAngle: number | null, minSeparationDeg = 45): number {
  if (lastAngle === null) return randomAngle();
  for (let i = 0; i < 12; i++) {
    const candidate = randomAngle();
    if (angularDistanceDeg(candidate, lastAngle) >= minSeparationDeg) return candidate;
  }
  return randomAngle();
}

function randomSoundType(): SoundType {
  return Math.random() > 0.5 ? "footstep" : "reload";
}

export function angularDistanceDeg(a: number, b: number): number {
  const diff = Math.abs((((a - b) % 360) + 540) % 360 - 180);
  return diff;
}

export function pointToAngleDeg(point: Point, center: Point): number {
  const radians = Math.atan2(point.y - center.y, point.x - center.x);
  return (((radians * 180) / Math.PI) + 360) % 360;
}

export function calculateClickAngle(point: Point, center: Point): number {
  const radians = Math.atan2(point.y - center.y, point.x - center.x);
  return ((radians * 180) / Math.PI + 360) % 360;
}

function successRateByDistance(trials: Trial[], min: number, max: number): number {
  const bucket = trials.filter((trial) => trial.distance >= min && trial.distance < max);
  const success = bucket.filter((trial) => trial.success === true);
  return percent(success.length, bucket.length);
}

export function buildResult(
  meta: ResultMeta,
  trials: Trial[]
): GameResult {
  const responded = trials.filter((trial) => trial.reactionMs !== undefined);
  const success = trials.filter((trial) => trial.success === true);
  const missed = trials.filter((trial) => trial.timedOut === true);
  const wrong = trials.filter(
    (trial) => trial.success === false && trial.timedOut !== true
  );
  const angleErrors = trials
    .map((trial) => trial.angleErrorDeg)
    .filter((value): value is number => value !== undefined);
  const positionalErrors = trials
    .map((trial) => trial.positionalError)
    .filter((value): value is number => value !== undefined);
  const distanceErrors = trials
    .map((trial) =>
      trial.clickDistance !== undefined
        ? Math.abs(trial.clickDistance - trial.distance)
        : undefined
    )
    .filter((value): value is number => value !== undefined);

  const avgError = average(angleErrors);
  const avgPosError = average(positionalErrors);
  const avgDistError = average(distanceErrors);
  const avgRt = average(responded.map((trial) => trial.reactionMs ?? 0));
  const accuracy = percent(success.length, trials.length);

  // คะแนน 0-100: ใช้ positional error เป็นหลัก
  // เพราะวัดทั้งทิศและระยะ
  // ตัวคูณ 140 = relax กว่าเดิม (200) ให้คะแนนไม่ตกฮวบเมื่อพลาดเล็กน้อย
  const positionalScore = Math.max(0, 100 - avgPosError * 140);
  const timeoutPenalty = Math.min(20, missed.length * 4);
  const score = Math.max(
    0,
    Math.min(100, accuracy * 0.55 + positionalScore * 0.45 - timeoutPenalty)
  );

  const rawData: AuditoryRawData = {
    totalTrials: trials.length,
    successCount: success.length,
    missedCount: missed.length,
    wrongCount: wrong.length,
    avgAngleErrorDeg: avgError,
    avgPositionalError: avgPosError,
    avgDistanceError: avgDistError,
    successRateNear: successRateByDistance(trials, 0, 0.34),
    successRateMid: successRateByDistance(trials, 0.34, 0.67),
    successRateFar: successRateByDistance(trials, 0.67, 1.01),
    trials: trials.map((trial) => ({
      index: trial.index,
      angleDeg: trial.angleDeg,
      clickAngleDeg: trial.clickAngleDeg ?? null,
      angleErrorDeg: trial.angleErrorDeg ?? null,
      distance: trial.distance,
      clickDistance: trial.clickDistance ?? null,
      positionalError: trial.positionalError ?? null,
      reactionMs: trial.reactionMs ?? null,
      soundType: trial.soundType,
      success: trial.success ?? null,
      timedOut: trial.timedOut === true,
    })),
  };

  return {
    schemaVersion: GAME_RESULT_SCHEMA_VERSION,
    gameId: GAME_ID,
    gameName: GAME_NAME,
    playerId: meta.playerId,
    sessionId: meta.sessionId,
    status: meta.status,
    score,
    accuracy,
    reactionTimeMs: avgRt,
    responseTimesMs: responded.map((trial) => trial.reactionMs ?? 0),
    startedAt: meta.startedAtIso,
    endedAt: meta.endedAtIso,
    durationMs: meta.durationMs,
    config: meta.config,
    rawData,
  };
}

export function useAuditoryGame(
  arenaRef: RefObject<HTMLDivElement>,
  options: UseAuditoryOptions
) {
  const {
    trials,
    successThresholdDeg,
    successThresholdDist = DEFAULT_SUCCESS_DIST,
    responseTimeoutMs,
    playerId,
    sessionId,
    onGameComplete,
  } = options;

  const audioBundleRef = useRef<AudioBundle | null>(null);
  const trialsRef = useRef<Trial[]>([]);
  const lastAngleRef = useRef<number | null>(null);
  const currentTrialRef = useRef<Trial | null>(null);
  const preDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const startTimeIsoRef = useRef("");
  const finalizedRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [trialIdx, setTrialIdx] = useState(0);
  const [showReveal, setShowReveal] = useState<RevealInfo | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [message, setMessage] = useState("กดเริ่มเพื่อเปิดระบบเสียง 3D");
  const [audioReady, setAudioReady] = useState(false);

  const clearTrialTimers = useCallback(() => {
    if (preDelayTimeoutRef.current) {
      clearTimeout(preDelayTimeoutRef.current);
      preDelayTimeoutRef.current = null;
    }
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  const prepareAudio = useCallback(async () => {
    audioBundleRef.current = await ensureAudioReady(audioBundleRef.current);
    setAudioReady(true);
    return audioBundleRef.current;
  }, []);

  const finalize = useCallback(
    (status: GameStatus = "completed") => {
      if (finalizedRef.current) return;

      finalizedRef.current = true;
      clearTrialTimers();
      setRunning(false);
      setWaitingForClick(false);
      setFinished(true);
      setMessage("ทดสอบเสร็จแล้ว");
      sfx.matchComplete();

      const endTime = performance.now();
      const result = buildResult(
        {
          playerId,
          sessionId,
          status,
          startedAtIso: startTimeIsoRef.current,
          endedAtIso: new Date().toISOString(),
          durationMs: endTime - startTimeRef.current,
          config: {
            trials,
            successThresholdDeg,
            successThresholdDist,
            responseTimeoutMs,
          },
        },
        trialsRef.current
      );

      setLastResult(result);
      onGameComplete(result);
    },
    [
      clearTrialTimers,
      onGameComplete,
      playerId,
      responseTimeoutMs,
      sessionId,
      successThresholdDeg,
      successThresholdDist,
      trials,
    ]
  );

  const scheduleNextTrial = useCallback(
    (nextIndex: number) => {
      clearTrialTimers();

      if (nextIndex >= trials) {
        finalize("completed");
        return;
      }

      setTrialIdx(nextIndex);
      setWaitingForClick(false);
      setShowReveal(null);
      setMessage("เตรียมฟังเสียง...");

      preDelayTimeoutRef.current = setTimeout(async () => {
        // กัน async race: ระหว่างรอ prepareAudio() ผู้ใช้อาจกด back-to-lobby
        // ทำให้ finalize() ถูกเรียกไปแล้ว — ห้าม push trial ใหม่
        if (finalizedRef.current) return;

        const bundle = await prepareAudio();
        if (finalizedRef.current) return;

        const angle = randomAngleAvoiding(lastAngleRef.current);
        lastAngleRef.current = angle;
        const trial: Trial = {
          index: nextIndex,
          angleDeg: angle,
          distance: randomRange(0.08, 0.95),
          soundType: randomSoundType(),
          playedAt: performance.now(),
        };

        currentTrialRef.current = trial;
        trialsRef.current.push(trial);
        playSpatialSound(bundle, trial.angleDeg, trial.distance, trial.soundType);
        setWaitingForClick(true);
        setMessage("คลิกตำแหน่งของเสียง (ทั้งทิศและระยะ)");

        responseTimeoutRef.current = setTimeout(() => {
          if (finalizedRef.current) return;
          if (currentTrialRef.current !== trial || trial.reactionMs !== undefined) {
            return;
          }

          trial.clickedAt = performance.now();
          trial.success = false;
          trial.timedOut = true;
          setWaitingForClick(false);
          sfx.miss();
          setShowReveal({
            trueAngle: trial.angleDeg,
            trueDistance: trial.distance,
            clickAngle: null,
            clickDistance: null,
            error: null,
            positionalError: null,
            success: false,
            timedOut: true,
          });
          setMessage("หมดเวลาในรอบนี้");

          revealTimeoutRef.current = setTimeout(() => {
            scheduleNextTrial(nextIndex + 1);
          }, REVEAL_DURATION_MS);
        }, responseTimeoutMs);
      }, randomRange(PRE_DELAY_MIN_MS, PRE_DELAY_MAX_MS));
    },
    [clearTrialTimers, finalize, prepareAudio, responseTimeoutMs, trials]
  );

  const start = useCallback(() => {
    void (async () => {
      clearTrialTimers();
      finalizedRef.current = false;
      trialsRef.current = [];
      lastAngleRef.current = null;
      currentTrialRef.current = null;
      setFinished(false);
      setLastResult(null);
      setShowReveal(null);
      setTrialIdx(0);
      setRunning(true);
      setWaitingForClick(false);
      setMessage("กำลังเปิดระบบเสียง...");

      await prepareAudio();
      startTimeRef.current = performance.now();
      startTimeIsoRef.current = new Date().toISOString();
      scheduleNextTrial(0);
    })();
  }, [clearTrialTimers, prepareAudio, scheduleNextTrial]);

  const testSound = useCallback(
    (side: "left" | "right" | "up" | "down") => {
      void (async () => {
        const bundle = await prepareAudio();
        // 0=ขวา, 90=ล่าง (south/back), 180=ซ้าย, 270=บน (north/front)
        const angle =
          side === "left" ? 180 : side === "right" ? 0 : side === "up" ? 270 : 90;
        // ใช้ distance ใกล้-กลาง (0.35) ให้เสียงดังพอที่จะใช้เป็น reference
        playSpatialSound(bundle, angle, 0.35, "footstep");
      })();
    },
    [prepareAudio]
  );

  const handleArenaClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!waitingForClick || !arenaRef.current || !currentTrialRef.current) return;

      const trial = currentTrialRef.current;
      // กันคลิกซ้ำ — ถ้า trial นี้ submit ผลไปแล้ว ห้ามคำนวณซ้ำ
      if (trial.reactionMs !== undefined) return;
      const rect = arenaRef.current.getBoundingClientRect();
      const clickPoint: Point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const center: Point = { x: rect.width / 2, y: rect.height / 2 };

      // ใช้ด้านที่สั้นกว่าของ arena เป็นรัศมีของเรดาร์
      // (เรดาร์เป็น aspect-square ที่ใหญ่ที่สุดเท่าที่ใส่ลงใน arena ได้)
      const radarRadius = Math.max(1, Math.min(rect.width, rect.height) / 2);

      const dx = clickPoint.x - center.x;
      const dy = clickPoint.y - center.y;
      const clickAngle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const clickDistanceRaw = Math.hypot(dx, dy);
      const clickDistanceNorm = Math.min(1.2, clickDistanceRaw / radarRadius);

      // คำนวณ positional error ใน normalized polar→cartesian space
      // true position: (cos(angle) * distance, sin(angle) * distance)
      const trueRad = (trial.angleDeg * Math.PI) / 180;
      const clickRad = (clickAngle * Math.PI) / 180;
      const trueX = Math.cos(trueRad) * trial.distance;
      const trueY = Math.sin(trueRad) * trial.distance;
      const clickX = Math.cos(clickRad) * clickDistanceNorm;
      const clickY = Math.sin(clickRad) * clickDistanceNorm;
      const positionalError = Math.hypot(clickX - trueX, clickY - trueY);

      const angleError = angularDistanceDeg(trial.angleDeg, clickAngle);
      const now = performance.now();

      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }

      trial.clickedAt = now;
      trial.clickAngleDeg = clickAngle;
      trial.clickDistance = clickDistanceNorm;
      trial.angleErrorDeg = angleError;
      trial.positionalError = positionalError;
      trial.reactionMs = now - trial.playedAt;
      trial.success = positionalError <= successThresholdDist;
      trial.timedOut = false;

      setWaitingForClick(false);
      sfx.reveal(trial.success);
      setShowReveal({
        trueAngle: trial.angleDeg,
        trueDistance: trial.distance,
        clickAngle,
        clickDistance: clickDistanceNorm,
        error: angleError,
        positionalError,
        success: trial.success,
        timedOut: false,
      });
      setMessage(
        trial.success
          ? "แม่นมาก! โดนเป้าทั้งทิศและระยะ"
          : positionalError < successThresholdDist * 2
            ? "ใกล้แล้ว ทิศ/ระยะคลาดเล็กน้อย"
            : "พลาดเป้า ลองสังเกตทั้งหูซ้าย/ขวาและความดัง"
      );

      revealTimeoutRef.current = setTimeout(() => {
        scheduleNextTrial(trial.index + 1);
      }, REVEAL_DURATION_MS);
    },
    [arenaRef, scheduleNextTrial, successThresholdDist, waitingForClick]
  );

  useEffect(() => {
    return () => {
      clearTrialTimers();
      const ctx = audioBundleRef.current?.context;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {/* ignore */});
      }
    };
  }, [clearTrialTimers]);

  return {
    running,
    finished,
    waitingForClick,
    trialIdx,
    trialCount: trials,
    showReveal,
    lastResult,
    message,
    audioReady,
    successThresholdDist,
    start,
    testSound,
    handleArenaClick,
  };
}
