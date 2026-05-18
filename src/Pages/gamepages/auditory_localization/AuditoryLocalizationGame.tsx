import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppButton } from "../../../components/common/AppButton";
import { SiteFooter } from "../../../components/layout/SiteFooter";
import { SiteHeader } from "../../../components/layout/SiteHeader";
import type { GameResult } from "../../../shared/gameModule";
import { sfx } from "../../../shared/sfx";
import { useAuditoryGame } from "./hooks/useAuditoryGame";
import {
  TRIALS,
  SUCCESS_THRESHOLD_DEG,
  SUCCESS_THRESHOLD_DIST,
  RESPONSE_TIMEOUT_MS,
} from "./config";
import { Radar } from "./ui/Radar";
import { buildAuditoryResultPayload } from "./utils/resultPayload";
import type { AuditoryRawData } from "./types";

function gradeFromScore(score: number): { letter: string; tone: string } {
  if (score >= 90) return { letter: "S", tone: "text-sp-warning" };
  if (score >= 80) return { letter: "A", tone: "text-sp-success" };
  if (score >= 65) return { letter: "B", tone: "text-sp-info" };
  if (score >= 50) return { letter: "C", tone: "text-sp-primary-hover" };
  return { letter: "D", tone: "text-sp-danger" };
}

function StatPill({ label, value, tone = "info" }: { label: string; value: string; tone?: "info" | "success" | "danger" | "warning" }) {
  const c = tone === "success" ? "text-sp-success" : tone === "danger" ? "text-sp-danger" : tone === "warning" ? "text-sp-warning" : "text-sp-info";
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-glass px-4 py-3 backdrop-blur-xl min-w-[132px]">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-sp-text-subtle">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-black ${c}`}>{value}</div>
    </div>
  );
}

function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-sp-bg/86 p-8 text-center backdrop-blur-md">
      <div className="rounded-sp-pill border border-sp-primary/30 bg-sp-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-sp-primary-hover">
        🎧 เตรียมฟังเสียง 3D
      </div>
      <div key={value} className="font-mono text-[clamp(84px,14vw,180px)] font-black text-sp-info drop-shadow-[0_0_35px_rgb(96_165_250/0.55)]">
        {value}
      </div>
      <p className="text-sm font-black uppercase tracking-[0.26em] text-sp-text-muted">
        WEAR HEADPHONES · LOCATE SOUND POSITION
      </p>
    </div>
  );
}

function StartOverlay({
  trials, threshold, responseTimeoutMs, onStart, onTestDir,
}: {
  trials: number; threshold: number; responseTimeoutMs: number;
  onStart: () => void;
  onTestDir: (side: "left" | "right" | "up" | "down") => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-start gap-3 overflow-y-auto bg-sp-bg/86 p-4 text-center backdrop-blur-md md:p-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="rounded-sp-pill border border-sp-primary/30 bg-sp-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-sp-primary-hover">
          MODULE PS-02 · 3D SOUND POSITION
        </div>
        <div className="rounded-sp-pill border border-sp-info/30 bg-sp-info-soft px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-sp-info">
          🎧 HEADPHONES REQUIRED
        </div>
      </div>

      <h2 className="max-w-[820px] bg-gradient-to-br from-sp-gradient-start to-sp-gradient-end bg-clip-text text-[clamp(24px,4vw,44px)] font-black uppercase leading-tight tracking-tight text-transparent">
        Auditory Localization
      </h2>
      <p className="max-w-[760px] text-sm leading-6 text-sp-text-muted">
        ใส่หูฟัง ฟังเสียง 3D แล้วคลิกตำแหน่งบนเรดาร์ตามที่ได้ยิน — ทั้ง
        <span className="text-sp-info"> ทิศทาง </span>และ
        <span className="text-sp-warning"> ระยะใกล้-ไกล </span>
        เสียงเบา = อยู่ไกล (วงนอก) · เสียงดัง = อยู่ใกล้ (ใกล้กลางจอ)
      </p>

      <div className="grid w-[min(800px,100%)] grid-cols-1 gap-3 text-left text-sm text-sp-text-muted sm:grid-cols-3">
        <div className="rounded-sp-lg border border-sp-border bg-sp-bg-soft p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">TRIALS</div>
          <div className="mt-1 font-mono text-xl font-black text-sp-info">{trials}</div>
        </div>
        <div className="rounded-sp-lg border border-sp-border bg-sp-bg-soft p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">SUCCESS</div>
          <div className="mt-1 font-mono text-xl font-black text-sp-success">≤ {(threshold * 100).toFixed(0)}%</div>
        </div>
        <div className="rounded-sp-lg border border-sp-border bg-sp-bg-soft p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">TIMEOUT</div>
          <div className="mt-1 font-mono text-xl font-black text-sp-warning">{(responseTimeoutMs / 1000).toFixed(1)}s</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-sp-text-subtle">🎧 PREVIEW SPATIAL AUDIO</div>
        <div className="grid grid-cols-3 gap-2">
          <span />
          <AppButton variant="glass" onClick={() => onTestDir("up")} className="px-5 py-2 text-sm uppercase tracking-[0.16em]">↑ FRONT</AppButton>
          <span />
          <AppButton variant="glass" onClick={() => onTestDir("left")} className="px-5 py-2 text-sm uppercase tracking-[0.16em]">← LEFT</AppButton>
          <div className="flex items-center justify-center rounded-sp-lg border border-sp-border bg-sp-bg-soft px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sp-text-subtle">YOU</div>
          <AppButton variant="glass" onClick={() => onTestDir("right")} className="px-5 py-2 text-sm uppercase tracking-[0.16em]">RIGHT →</AppButton>
          <span />
          <AppButton variant="glass" onClick={() => onTestDir("down")} className="px-5 py-2 text-sm uppercase tracking-[0.16em]">↓ BACK</AppButton>
          <span />
        </div>
      </div>

      <AppButton onClick={onStart} className="mb-4 px-7 py-3 text-base uppercase tracking-[0.18em]">
        ENGAGE TEST →
      </AppButton>
    </div>
  );
}

function ResultOverlay({ result, onRestart, onExit }: { result: GameResult; onRestart: () => void; onExit: () => void }) {
  const raw = result.rawData as AuditoryRawData;
  const grade = gradeFromScore(result.score);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-sp-bg/86 p-8 text-center backdrop-blur-md">
      <div className="rounded-sp-pill border border-sp-success/30 bg-sp-success-soft px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-sp-success">
        ● MATCH COMPLETE
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-sp-lg border-2 border-sp-border bg-sp-bg-soft">
          <div className={`font-mono text-7xl font-black ${grade.tone}`}>{grade.letter}</div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-sp-pill border border-sp-border bg-sp-bg px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-sp-text-subtle">GRADE</div>
        </div>
        <div className="text-left">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">SCORE</div>
          <div className="font-mono text-7xl font-black text-sp-info drop-shadow-[0_0_24px_rgb(96_165_250/0.55)]">{result.score.toFixed(1)}</div>
          <div className="text-[10px] font-mono text-sp-text-subtle">/100</div>
        </div>
      </div>

      <h2 className="text-[clamp(28px,3.5vw,44px)] font-black uppercase tracking-tight text-sp-text">ผลการระบุตำแหน่งเสียง</h2>

      <div className="grid w-[min(960px,100%)] grid-cols-2 gap-3 md:grid-cols-6">
        <StatPill label="Accuracy" value={`${(result.accuracy ?? 0).toFixed(1)}%`} tone="success" />
        <StatPill label="Pos Err" value={`${(raw.avgPositionalError * 100).toFixed(1)}%`} />
        <StatPill label="Angle Err" value={`${raw.avgAngleErrorDeg.toFixed(1)}°`} />
        <StatPill label="Dist Err" value={`${(raw.avgDistanceError * 100).toFixed(1)}%`} tone="warning" />
        <StatPill label="Timeout" value={`${raw.missedCount}`} tone="danger" />
        <StatPill label="Reaction" value={`${(result.reactionTimeMs ?? 0).toFixed(0)}ms`} />
      </div>

      <div className="grid w-[min(720px,100%)] grid-cols-3 gap-3">
        <div className="rounded-sp-lg border border-sp-border bg-sp-bg-soft p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sp-text-subtle">NEAR (ใกล้)</div>
          <div className="mt-1 font-mono text-xl font-black text-sp-success">{raw.successRateNear.toFixed(0)}%</div>
        </div>
        <div className="rounded-sp-lg border border-sp-border bg-sp-bg-soft p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sp-text-subtle">MID (กลาง)</div>
          <div className="mt-1 font-mono text-xl font-black text-sp-info">{raw.successRateMid.toFixed(0)}%</div>
        </div>
        <div className="rounded-sp-lg border border-sp-border bg-sp-bg-soft p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sp-text-subtle">FAR (ไกล)</div>
          <div className="mt-1 font-mono text-xl font-black text-sp-warning">{raw.successRateFar.toFixed(0)}%</div>
        </div>
      </div>

      <div className="flex gap-3">
        <AppButton onClick={onRestart} className="px-6 py-3 text-sm uppercase tracking-[0.18em]">REMATCH ↻</AppButton>
        <AppButton variant="glass" onClick={onExit} className="px-6 py-3 text-sm uppercase tracking-[0.18em]">EXIT TO LOBBY</AppButton>
      </div>
    </div>
  );
}

export default function AuditoryLocalizationGamePage() {
  const navigate = useNavigate();
  const arenaRef = useRef<HTMLDivElement>(null);
  const hasSentRef = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const sessionId = useMemo(() => `session-${Date.now()}`, []);
  const playerId = "demo-player-001";

  const handleGameComplete = (result: GameResult) => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    const payload = buildAuditoryResultPayload(result);
    window.dispatchEvent(
      new CustomEvent("skillpulse:game-result-ready", { detail: payload }),
    );
  };

  const game = useAuditoryGame(arenaRef, {
    trials: TRIALS,
    successThresholdDeg: SUCCESS_THRESHOLD_DEG,
    successThresholdDist: SUCCESS_THRESHOLD_DIST,
    responseTimeoutMs: RESPONSE_TIMEOUT_MS,
    playerId,
    sessionId,
    onGameComplete: handleGameComplete,
  });

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      sfx.countdownGo();
      game.start();
      return;
    }
    sfx.countdownTick();
    const t = window.setTimeout(() => setCountdown((v) => (v === null ? null : v - 1)), 720);
    return () => window.clearTimeout(t);
  }, [countdown, game.start]);

  const handleStart = () => {
    if (countdown === null && !game.running) setCountdown(3);
  };

  const revealClass = game.showReveal
    ? game.showReveal.success
      ? "shadow-[inset_0_0_120px_rgb(52_211_153/0.2)]"
      : "shadow-[inset_0_0_120px_rgb(251_113_133/0.2)]"
    : "";

  const trialIdx = game.trialIdx;
  const displayRound = Math.min(trialIdx + 1, game.trialCount);
  const progress = Math.max(0, Math.min(100, (trialIdx / game.trialCount) * 100));

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-8 md:px-12 md:py-12">
        <section className="animate-sp-fade-in mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link
              to="/gameinfo/auditory-localization"
              className="group inline-flex w-fit items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
            >
              <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>กลับไปหน้ารายละเอียดเกม</span>
            </Link>
            <div className="inline-flex w-fit items-center gap-2 rounded-sp-pill border border-sp-primary/30 bg-sp-primary/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-sp-primary-hover">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sp-primary" />
              MODULE PS-02 · Auditory
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <StatPill label="ROUND" value={`${displayRound}/${game.trialCount}`} />
            <StatPill label="STATE" value={game.waitingForClick ? "CLICK" : "LISTEN"} tone={game.waitingForClick ? "success" : "info"} />
            <StatPill label="AUDIO" value={game.audioReady ? "READY" : "LOCKED"} tone={game.audioReady ? "success" : "warning"} />
            <div className="rounded-sp-pill border border-sp-info/30 bg-sp-info-soft px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-sp-info">
              🎧 USE HEADPHONES
            </div>
          </div>

          <div className="mb-4 h-3 overflow-hidden rounded-sp-pill border border-sp-border bg-sp-surface-muted">
            <div
              className="h-full rounded-sp-pill bg-gradient-to-r from-sp-primary via-sp-info to-sp-success transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div
            ref={arenaRef}
            className={`relative h-[62vh] min-h-[460px] w-full cursor-crosshair overflow-hidden rounded-sp-card border border-sp-border bg-sp-bg-soft shadow-sp-brand transition-shadow duration-150 sm:h-[70vh] ${revealClass}`}
            onClick={game.handleArenaClick}
          >
            <Radar reveal={game.showReveal} waitingForClick={game.waitingForClick} message={game.message} />

            {game.running && game.waitingForClick && (
              <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-sp-pill border border-sp-primary/30 bg-sp-primary/10 px-5 py-2 text-sm font-black uppercase tracking-[0.2em] text-sp-primary-hover">
                ● CLICK POSITION (ทิศ + ระยะ)
              </div>
            )}

            {!game.running && !game.finished && countdown === null && (
              <StartOverlay
                trials={TRIALS}
                threshold={SUCCESS_THRESHOLD_DIST}
                responseTimeoutMs={RESPONSE_TIMEOUT_MS}
                onStart={handleStart}
                onTestDir={(side) => game.testSound(side)}
              />
            )}

            {countdown !== null && <CountdownOverlay value={Math.max(1, countdown)} />}

            {game.finished && game.lastResult && (
              <ResultOverlay
                result={game.lastResult}
                onRestart={handleStart}
                onExit={() => navigate("/librarygame")}
              />
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
