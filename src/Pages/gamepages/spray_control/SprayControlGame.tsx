import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { AppButton } from "../../../components/common/AppButton";
import { SiteFooter } from "../../../components/layout/SiteFooter";
import { SiteHeader } from "../../../components/layout/SiteHeader";
import type { GameResult } from "../../../shared/gameModule";
import { useSprayControlGame } from "./hooks/useSprayControlGame";
import { MAGAZINE_SIZE, TARGET_RADIUS_PX } from "./config";
import { SprayStatCard } from "./ui/SprayStatCard";
import { GhostRecoilPreview } from "./ui/GhostRecoilPreview";
import { QuadrantHeatmap } from "./ui/QuadrantHeatmap";
import { buildSprayControlResultPayload } from "./utils/resultPayload";

function gradeFromScore(score: number): { letter: string; tone: string } {
  if (score >= 85) return { letter: "S", tone: "text-sp-warning" };
  if (score >= 72) return { letter: "A", tone: "text-sp-success" };
  if (score >= 58) return { letter: "B", tone: "text-sp-info" };
  if (score >= 42) return { letter: "C", tone: "text-sp-primary-hover" };
  return { letter: "D", tone: "text-sp-danger" };
}

function AmmoStrip({ used, total }: { used: number; total: number }) {
  const remaining = Math.max(0, total - used);
  const cells = Math.min(total, 30);
  const usedCells = Math.min(cells, Math.round((used / total) * cells));

  return (
    <div className="flex items-center gap-3">
      <div className="font-mono text-2xl font-black text-sp-text">
        <span>{remaining}</span>
        <span className="ml-1 text-sm text-sp-text-subtle">/{total}</span>
      </div>
      <div className="flex h-6 items-end gap-[3px]">
        {Array.from({ length: cells }).map((_, idx) => {
          const isUsed = idx < usedCells;
          return (
            <span
              key={idx}
              className={"h-full w-1 rounded-sm transition " +
                (isUsed
                  ? "bg-sp-surface-strong/70"
                  : "bg-gradient-to-t from-sp-danger to-sp-warning shadow-[0_0_6px_rgb(251_113_133/0.6)]")}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function SprayControlGamePage() {
  const navigate = useNavigate();
  const arenaRef = useRef<HTMLDivElement>(null);
  const hasSentRef = useRef(false);

  const sessionId = useMemo(() => `session-${Date.now()}`, []);
  const playerId = "demo-player-001";
  const magazineSize = MAGAZINE_SIZE;
  const targetRadiusPx = TARGET_RADIUS_PX;

  const handleGameComplete = (result: GameResult) => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    const payload = buildSprayControlResultPayload(result);
    window.dispatchEvent(
      new CustomEvent("skillpulse:game-result-ready", { detail: payload }),
    );
  };

  const game = useSprayControlGame(arenaRef, {
    playerId,
    sessionId,
    onGameComplete: handleGameComplete,
    magazineSize,
    targetRadiusPx,
  });

  useEffect(() => {
    if (game.phase !== "finished") hasSentRef.current = false;
  }, [game.phase]);

  const resultRaw = game.result?.rawData as
    | {
        hitRatePct?: number;
        perfectRatePct?: number;
        avgShotErrorPx?: number;
        maxShotErrorPx?: number;
        groupingRadiusPx?: number;
        verticalControlScore?: number;
        horizontalControlScore?: number;
        timeToFirstShotMs?: number | null;
        totalShots?: number;
        quadrantCounts?: { UL: number; UR: number; LL: number; LR: number };
      }
    | undefined;

  const statusLabel =
    game.phase === "idle" ? "STANDBY"
    : game.phase === "countdown" ? "LOAD MAG"
    : game.phase === "ready" ? "HOLD FIRE"
    : game.phase === "spraying" ? "FIRING"
    : game.phase === "foul" ? "FOUL"
    : "MATCH ENDED";

  const statusTone =
    game.phase === "foul" ? "border-sp-danger/40 bg-sp-danger-soft text-sp-danger"
    : game.phase === "spraying" ? "border-sp-warning/40 bg-sp-warning-soft text-sp-warning"
    : game.phase === "ready" ? "border-sp-warning/40 bg-sp-warning-soft text-sp-warning"
    : game.phase === "countdown" ? "border-sp-info/40 bg-sp-info-soft text-sp-info"
    : "border-sp-success/40 bg-sp-success-soft text-sp-success";

  const lastShotState = game.lastShot?.perfect ? "PERFECT" : game.lastShot?.hit ? "HIT" : game.lastShot ? "MISS" : "—";
  const lastShotTone = game.lastShot?.perfect
    ? "text-sp-success"
    : game.lastShot?.hit
    ? "text-sp-info"
    : game.lastShot
    ? "text-sp-danger"
    : "text-sp-text-muted";

  const grade = game.result ? gradeFromScore(game.result.score) : null;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-8 md:px-12 md:py-12">
        <section className="animate-sp-fade-in mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link
              to="/gameinfo/spray-control"
              className="group inline-flex w-fit items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
            >
              <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>กลับไปหน้ารายละเอียดเกม</span>
            </Link>

            <div className={"inline-flex w-fit items-center gap-2 rounded-sp-pill border px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest " + statusTone}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              {statusLabel} · Spray Control
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SprayStatCard label="Ammo" value={`${Math.max(0, magazineSize - game.currentShot)}/${magazineSize}`} />
            <SprayStatCard label="Hits" value={`${game.hitCount}`} tone="info" />
            <SprayStatCard label="Perfect" value={`${game.perfectCount}`} tone="success" />
            <SprayStatCard label="Avg Err" value={`${Math.round(game.avgErrorPx)}px`} tone="warning" />
          </div>

          <div className="mb-3 flex items-center justify-between gap-4 rounded-sp-lg border border-sp-border bg-sp-glass px-4 py-2.5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-sp-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-sp-danger" />
              AMMO STRIP
            </div>
            <AmmoStrip used={game.currentShot} total={magazineSize} />
          </div>

          <div className="mb-4 h-2.5 overflow-hidden rounded-sp-pill border border-sp-border bg-sp-surface-muted">
            <div
              className="h-full rounded-sp-pill bg-gradient-to-r from-sp-danger via-sp-warning to-sp-info transition-[width] duration-150"
              style={{ width: `${game.progressPct}%` }}
            />
          </div>

          <div
            ref={arenaRef}
            onPointerMove={game.handlePointerMove}
            onPointerDown={game.handlePointerDown}
            onPointerUp={game.handlePointerUp}
            onPointerCancel={game.handlePointerUp}
            className="relative h-[560px] cursor-none select-none overflow-hidden rounded-sp-card border border-sp-border bg-sp-bg-soft shadow-sp-brand"
          >
            <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="pointer-events-none absolute right-5 top-5 z-10 flex flex-col items-end gap-1">
              <span className="rounded-sp-sm border border-sp-border bg-sp-glass px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sp-text-muted backdrop-blur-xl">
                RANGE · TRAINING
              </span>
              <span className="rounded-sp-sm border border-sp-border bg-sp-glass px-2 py-1 font-mono text-[10px] font-black text-sp-text-muted backdrop-blur-xl">
                FOV 90°
              </span>
            </div>

            {game.phase === "idle" ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-sp-bg/86 p-8 text-center backdrop-blur-md">
                <div className="max-w-xl rounded-sp-card border border-sp-border bg-sp-glass p-8 backdrop-blur-xl">
                  <div className="mx-auto mb-3"><GhostRecoilPreview size={150} /></div>
                  <div className="text-[11px] font-black uppercase tracking-[0.32em] text-sp-text-muted">RECOIL PATTERN</div>
                  <h3 className="mt-2 text-2xl font-black text-sp-text">เตรียมพร้อม · Spray Control</h3>
                  <p className="mt-3 text-sm leading-6 text-sp-text-muted">
                    หลังนับถอยหลัง วางเมาส์ที่เป้าแล้ว <b className="text-sp-warning">กดคลิกซ้ายค้าง</b> ลากเมาส์สวน recoil ให้กระสุนเกาะวงเป้า
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-left">
                    <div className="rounded-sp-md border border-sp-border bg-sp-bg-soft p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-sp-text-subtle">Mag</div>
                      <div className="font-mono text-base font-black text-sp-warning">{magazineSize}</div>
                    </div>
                    <div className="rounded-sp-md border border-sp-border bg-sp-bg-soft p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-sp-text-subtle">Fire</div>
                      <div className="font-mono text-base font-black text-sp-warning">FULL AUTO</div>
                    </div>
                    <div className="rounded-sp-md border border-sp-border bg-sp-bg-soft p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-sp-text-subtle">Target</div>
                      <div className="font-mono text-base font-black text-sp-warning">{targetRadiusPx}px</div>
                    </div>
                  </div>
                  <AppButton onClick={game.start} className="mt-7 w-full px-7 py-3 text-base uppercase tracking-[0.18em]">
                    ENGAGE TARGET →
                  </AppButton>
                </div>
              </div>
            ) : null}

            {game.phase === "countdown" ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-sp-bg/72 backdrop-blur-md">
                <div className="text-center">
                  <div className="inline-flex rounded-sp-pill border border-sp-warning/30 bg-sp-warning-soft px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] text-sp-warning">LOAD MAG</div>
                  <div className="mt-3 font-mono text-[9rem] font-black leading-none text-sp-warning drop-shadow-[0_0_45px_rgb(251_191_36/0.7)] animate-pulse">
                    {game.countdown}
                  </div>
                </div>
              </div>
            ) : null}

            {game.phase === "ready" ? (
              <div className="pointer-events-none absolute inset-x-0 top-7 z-20 flex justify-center">
                <div className="rounded-sp-lg border border-sp-warning/30 bg-sp-glass px-5 py-3 text-center backdrop-blur-xl">
                  <div className="text-[10px] font-black uppercase tracking-[0.32em] text-sp-warning">INSTRUCTION</div>
                  <div className="mt-1 text-lg font-black text-sp-text">
                    กด <span className="rounded-sp-sm border border-sp-warning/40 bg-sp-warning-soft px-2 py-0.5 font-mono text-sp-warning">L-CLICK</span> ค้างเพื่อยิง 1 แม็ก
                  </div>
                  <div className="mt-1 text-xs text-sp-text-muted">เริ่มภายใน {Math.ceil(game.readyTimeLeftMs / 1000)}s</div>
                </div>
              </div>
            ) : null}

            {game.phase === "foul" ? (
              <>
                <div className="pointer-events-none absolute inset-0 z-20 bg-sp-danger-soft" />
                <div className="absolute left-1/2 top-6 z-30 flex w-[min(560px,calc(100%-2rem))] -translate-x-1/2 flex-col items-center gap-3 rounded-sp-lg border-2 border-sp-danger/60 bg-sp-glass p-4 shadow-sp-brand backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-sp-pill border border-sp-danger/40 bg-sp-danger-soft px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] text-sp-danger">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sp-danger" />
                      INVALID
                    </div>
                    <div className="font-mono text-3xl font-black text-sp-danger drop-shadow-[0_0_18px_rgb(251_113_133/0.7)]">FOUL</div>
                  </div>
                  <p className="text-center text-xs leading-5 text-sp-text-muted">
                    ปล่อยปุ่มเร็วเกินไป — ต้องกดค้างจนครบ <b className="text-sp-danger">{magazineSize}</b> นัด
                    <br />
                    ยิงไป <b className="text-sp-danger">{game.currentShot}/{magazineSize}</b> นัด — รอบนี้ไม่นับคะแนน
                  </p>
                  <div className="flex gap-2">
                    <AppButton onClick={game.start} className="px-5 py-2 text-xs uppercase tracking-[0.2em]">RETRY ↻</AppButton>
                    <AppButton variant="glass" onClick={() => navigate("/librarygame")} className="px-5 py-2 text-xs uppercase tracking-[0.2em]">EXIT</AppButton>
                  </div>
                </div>
              </>
            ) : null}

            {game.phase === "finished" && game.result ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-sp-bg/82 p-6 backdrop-blur-md">
                <div className="w-full max-w-3xl rounded-sp-card border border-sp-border bg-sp-glass p-7 shadow-sp-brand-lg backdrop-blur-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-sp-pill border border-sp-success/30 bg-sp-success-soft px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-sp-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-sp-success" />
                        MATCH COMPLETE
                      </div>
                      <h3 className="mt-3 text-3xl font-black text-sp-text">SPRAY CONTROL</h3>
                    </div>
                    <div className="flex items-center gap-5">
                      {grade ? (
                        <div className={"relative flex h-24 w-24 items-center justify-center rounded-sp-lg border-2 border-sp-border bg-sp-bg-soft"}>
                          <div className={`font-mono text-6xl font-black ${grade.tone}`}>{grade.letter}</div>
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-sp-pill border border-sp-border bg-sp-bg px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-sp-text-subtle">GRADE</div>
                        </div>
                      ) : null}
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">Score</div>
                        <div className="font-mono text-6xl font-black text-sp-text">{game.result.score}</div>
                        <div className="text-[10px] font-mono text-sp-text-subtle">/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <SprayStatCard label="Hit Rate" value={`${resultRaw?.hitRatePct ?? 0}%`} tone="info" />
                    <SprayStatCard label="Perfect" value={`${resultRaw?.perfectRatePct ?? 0}%`} tone="success" />
                    <SprayStatCard label="Avg Error" value={`${resultRaw?.avgShotErrorPx ?? 0}px`} tone="warning" />
                    <SprayStatCard label="Max Error" value={`${resultRaw?.maxShotErrorPx ?? 0}px`} tone="danger" />
                    <SprayStatCard label="Grouping" value={`${resultRaw?.groupingRadiusPx ?? 0}px`} />
                    <SprayStatCard label="Vertical" value={`${resultRaw?.verticalControlScore ?? 0}`} hint="control" />
                    <SprayStatCard label="Horizontal" value={`${resultRaw?.horizontalControlScore ?? 0}`} hint="control" />
                    <SprayStatCard label="First Shot" value={resultRaw?.timeToFirstShotMs == null ? "—" : `${resultRaw.timeToFirstShotMs}ms`} hint="reaction" />
                  </div>

                  {resultRaw?.quadrantCounts ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                      <div className="rounded-sp-lg border border-sp-border bg-sp-surface-muted p-4">
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-sp-text-muted">
                          SHOT DISTRIBUTION (vs target)
                        </div>
                        <p className="text-xs leading-5 text-sp-text-muted">
                          การกระจายกระสุนรอบเป้า — quadrant ที่เยอะคือทิศที่กลุ่มกระสุนเอนเอียง
                        </p>
                      </div>
                      <div className="min-w-[200px]">
                        <QuadrantHeatmap q={resultRaw.quadrantCounts} total={(resultRaw.totalShots ?? magazineSize) || 1} />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-7 flex flex-wrap gap-3">
                    <AppButton onClick={game.start} className="px-6 py-3 text-sm uppercase tracking-[0.18em]">REMATCH ↻</AppButton>
                    <AppButton variant="glass" onClick={() => navigate("/librarygame")} className="px-6 py-3 text-sm uppercase tracking-[0.18em]">EXIT TO LOBBY</AppButton>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Target circles */}
            <div
              className="pointer-events-none absolute rounded-full border-2 border-sp-danger/85 bg-sp-danger/10 shadow-[0_0_55px_rgb(251_113_133/0.4)]"
              style={{
                left: game.targetX,
                top: game.targetY,
                width: targetRadiusPx * 2,
                height: targetRadiusPx * 2,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 rounded-full border border-sp-success/80 bg-sp-success/15 shadow-[0_0_22px_rgb(52_211_153/0.55)]"
                style={{
                  width: game.config.perfectRadiusPx * 2,
                  height: game.config.perfectRadiusPx * 2,
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sp-warning shadow-[0_0_22px_rgb(251_191_36/0.95)]" />
            </div>

            {/* Bullet impacts */}
            {game.shots.map((shot) => (
              <div
                key={shot.shotIndex}
                className={"pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border " + (
                  shot.perfect
                    ? "border-sp-success bg-sp-success shadow-[0_0_16px_rgb(52_211_153/0.95)]"
                    : shot.hit
                      ? "border-sp-info bg-sp-info shadow-[0_0_16px_rgb(96_165_250/0.8)]"
                      : "border-sp-danger bg-sp-danger shadow-[0_0_16px_rgb(251_113_133/0.8)]"
                )}
                style={{ left: shot.shotX, top: shot.shotY }}
              />
            ))}

            {/* Crosshair */}
            <div
              className="pointer-events-none absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sp-text/90 shadow-[0_0_24px_rgb(248_250_252/0.4)]"
              style={{ left: game.aimX, top: game.aimY }}
            >
              <div className="absolute left-1/2 top-[-14px] h-3 w-px -translate-x-1/2 bg-sp-text/85" />
              <div className="absolute bottom-[-14px] left-1/2 h-3 w-px -translate-x-1/2 bg-sp-text/85" />
              <div className="absolute left-[-14px] top-1/2 h-px w-3 -translate-y-1/2 bg-sp-text/85" />
              <div className="absolute right-[-14px] top-1/2 h-px w-3 -translate-y-1/2 bg-sp-text/85" />
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sp-text" />
              {game.phase === "spraying" ? (
                <div className="absolute -inset-3 animate-ping rounded-full border border-sp-danger/60" />
              ) : null}
            </div>

            {/* Bottom HUD */}
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-sp-lg border border-sp-border bg-sp-glass p-3 backdrop-blur-xl">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">LAST SHOT</div>
                <div className={`mt-1 font-mono text-lg font-black ${lastShotTone}`}>{lastShotState}</div>
              </div>
              <div className="rounded-sp-lg border border-sp-border bg-sp-glass p-3 backdrop-blur-xl">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">SPRAY TIP</div>
                <div className="mt-1 text-sm font-bold text-sp-text">
                  ลากเมาส์ <span className="text-sp-warning">ลง</span> สวน recoil — แก้ <span className="text-sp-info">ซ้าย/ขวา</span>
                </div>
              </div>
              <div className="rounded-sp-lg border border-sp-border bg-sp-glass p-3 backdrop-blur-xl">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sp-text-subtle">FIRE MODE</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-sp-danger">FULL-AUTO</span>
                  <span className="rounded-sp-sm border border-sp-danger/40 bg-sp-danger-soft px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-sp-danger">●REC</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
