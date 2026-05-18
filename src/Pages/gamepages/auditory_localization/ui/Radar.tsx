import type { ReactNode } from "react";
import type { RevealInfo } from "../types";

/** เป้าจริง = จุดเขียวเปล่งแสง วางตาม polar (angle, distance) */
function TrueTargetDot({ angle, distance }: { angle: number; distance: number }) {
  const r = Math.max(0, Math.min(1, distance));
  const radians = (angle * Math.PI) / 180;
  const x = 50 + Math.cos(radians) * r * 46;
  const y = 50 + Math.sin(radians) * r * 46;
  return (
    <>
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sp-success/70 bg-sp-success/15 shadow-[0_0_22px_rgb(52_211_153/0.6)]"
        style={{ left: `${x}%`, top: `${y}%`, width: 56, height: 56 }}
      />
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 border-sp-success/60"
        style={{ left: `${x}%`, top: `${y}%`, width: 70, height: 70 }}
      />
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-sp-success shadow-[0_0_18px_rgb(52_211_153/0.9)]"
        style={{ left: `${x}%`, top: `${y}%`, width: 14, height: 14 }}
      />
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-sp-pill bg-sp-bg/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-sp-success"
        style={{ left: `${x}%`, top: `calc(${y}% + 30px)` }}
      >
        TARGET
      </span>
    </>
  );
}

function ClickDot({ angle, distance, success }: { angle: number; distance: number; success: boolean }) {
  const r = Math.max(0, Math.min(1.05, distance));
  const radians = (angle * Math.PI) / 180;
  const x = 50 + Math.cos(radians) * r * 46;
  const y = 50 + Math.sin(radians) * r * 46;
  const ringClass = success
    ? "border-2 border-sp-success/80 bg-sp-success/15 shadow-[0_0_18px_rgb(52_211_153/0.55)]"
    : "border-2 border-sp-danger/80 bg-sp-danger/15 shadow-[0_0_18px_rgb(251_113_133/0.55)]";
  const coreClass = success ? "bg-sp-success" : "bg-sp-danger";
  const labelClass = success ? "text-sp-success" : "text-sp-danger";
  return (
    <>
      <span className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${ringClass}`}
        style={{ left: `${x}%`, top: `${y}%`, width: 36, height: 36 }} />
      <span className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${coreClass}`}
        style={{ left: `${x}%`, top: `${y}%`, width: 10, height: 10 }} />
      <span className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-sp-pill bg-sp-bg/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${labelClass}`}
        style={{ left: `${x}%`, top: `calc(${y}% + 22px)` }}>YOU</span>
    </>
  );
}

function ErrorConnector({ trueAngle, trueDistance, clickAngle, clickDistance }: { trueAngle: number; trueDistance: number; clickAngle: number; clickDistance: number }) {
  const tr = (trueAngle * Math.PI) / 180;
  const cr = (clickAngle * Math.PI) / 180;
  const tx = 50 + Math.cos(tr) * Math.min(1, trueDistance) * 46;
  const ty = 50 + Math.sin(tr) * Math.min(1, trueDistance) * 46;
  const cx = 50 + Math.cos(cr) * Math.min(1.05, clickDistance) * 46;
  const cy = 50 + Math.sin(cr) * Math.min(1.05, clickDistance) * 46;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1={tx} y1={ty} x2={cx} y2={cy} stroke="rgb(248 250 252 / 0.5)" strokeWidth="0.4" strokeDasharray="1.2 1.2" />
    </svg>
  );
}

function CompassMark({ label, angle }: { label: string; angle: number }) {
  const radians = (angle * Math.PI) / 180;
  const r = 49;
  const x = 50 + Math.cos(radians) * r;
  const y = 50 + Math.sin(radians) * r;
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-sp-pill border border-sp-info/30 bg-sp-bg/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-sp-info backdrop-blur-xl"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {label}
    </span>
  );
}

function SoundBars({ active }: { active: boolean }) {
  return (
    <div className="flex h-12 items-center justify-center gap-1.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={`w-2 rounded-full bg-sp-info ${active ? "animate-pulse" : "h-3 opacity-40"}`}
          style={{ height: active ? `${20 + Math.sin(Date.now() / 80 + index) * 16}px` : undefined }}
        />
      ))}
    </div>
  );
}

export function Radar({
  reveal,
  waitingForClick,
  message,
}: {
  reveal: RevealInfo | null;
  waitingForClick: boolean;
  message: string;
}) {
  const statusText = reveal
    ? reveal.timedOut
      ? "TIMEOUT"
      : reveal.success
        ? "ON TARGET"
        : "MISS"
    : waitingForClick
      ? "CLICK POSITION"
      : "LISTEN";

  const statusTone = reveal
    ? reveal.timedOut
      ? "border-sp-danger/40 bg-sp-danger-soft text-sp-danger"
      : reveal.success
        ? "border-sp-success/40 bg-sp-success-soft text-sp-success"
        : "border-sp-warning/40 bg-sp-warning-soft text-sp-warning"
    : waitingForClick
      ? "border-sp-primary/40 bg-sp-primary/10 text-sp-primary-hover"
      : "border-sp-info/30 bg-sp-info-soft text-sp-info";

  // Front-back flip detection
  let flipBadge: ReactNode = null;
  if (reveal && !reveal.timedOut && reveal.clickAngle !== null) {
    const mirror = (360 - reveal.trueAngle) % 360;
    const distToTrue = Math.abs((((reveal.clickAngle - reveal.trueAngle) % 360) + 540) % 360 - 180);
    const distToMirror = Math.abs((((reveal.clickAngle - mirror) % 360) + 540) % 360 - 180);
    if (distToMirror < distToTrue - 10 && distToMirror < 35 && (reveal.positionalError ?? 0) > 0.1) {
      flipBadge = (
        <div className="inline-flex items-center gap-2 rounded-sp-pill border border-sp-warning/40 bg-sp-warning-soft px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sp-warning">
          ⚠ FRONT/BACK FLIP
        </div>
      );
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative aspect-square w-[min(75vh,84vw)] rounded-full border border-sp-info/25 bg-sp-bg/25 shadow-[inset_0_0_90px_rgb(96_165_250/0.16)]">
        <div className="absolute inset-[10%] rounded-full border border-sp-info/14" />
        <div className="absolute inset-[28%] rounded-full border border-sp-info/18" />
        <div className="absolute inset-[46%] rounded-full border border-sp-info/22" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sp-info/12" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-sp-info/12" />

        <span className="absolute left-1/2 top-[10%] -translate-x-1/2 rounded-sp-sm border border-sp-info/20 bg-sp-bg/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-sp-text-subtle backdrop-blur-xl">FAR</span>
        <span className="absolute left-1/2 top-[28%] -translate-x-1/2 rounded-sp-sm border border-sp-info/20 bg-sp-bg/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-sp-text-subtle backdrop-blur-xl">MID</span>
        <span className="absolute left-1/2 top-[46%] -translate-x-1/2 rounded-sp-sm border border-sp-info/20 bg-sp-bg/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-sp-text-subtle backdrop-blur-xl">NEAR</span>

        <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sp-info bg-sp-info/20 shadow-[0_0_18px_rgb(96_165_250/0.5)]" />

        <CompassMark label="N" angle={270} />
        <CompassMark label="E" angle={0} />
        <CompassMark label="S" angle={90} />
        <CompassMark label="W" angle={180} />

        {waitingForClick && (
          <div className="absolute inset-[32%] animate-pulse rounded-full border-2 border-sp-primary/40 shadow-[0_0_22px_rgb(99_102_241/0.5)]" />
        )}

        {reveal && (
          <>
            <TrueTargetDot angle={reveal.trueAngle} distance={reveal.trueDistance} />
            {reveal.clickAngle !== null && reveal.clickDistance !== null && (
              <>
                <ErrorConnector
                  trueAngle={reveal.trueAngle}
                  trueDistance={reveal.trueDistance}
                  clickAngle={reveal.clickAngle}
                  clickDistance={reveal.clickDistance}
                />
                <ClickDot angle={reveal.clickAngle} distance={reveal.clickDistance} success={reveal.success} />
              </>
            )}
          </>
        )}

        <div className="absolute inset-x-8 top-10 flex flex-col items-center gap-2 text-center">
          <div className={`inline-flex rounded-sp-pill border px-4 py-1 text-xs font-black uppercase tracking-[0.22em] ${statusTone}`}>
            ● {statusText}
          </div>
          {flipBadge}
        </div>

        <div className="absolute inset-x-8 bottom-10 text-center">
          <SoundBars active={waitingForClick} />
          <div className="mt-2 text-sm font-bold text-sp-text-muted">{message}</div>
          {reveal && reveal.positionalError !== null && reveal.error !== null && (
            <div className="mt-1 flex justify-center gap-3 font-mono text-[11px] text-sp-text-subtle">
              <span>angle: <span className="text-sp-info">{reveal.error.toFixed(1)}°</span></span>
              <span>pos err: <span className="text-sp-info">{(reveal.positionalError * 100).toFixed(1)}%</span></span>
              {reveal.clickDistance !== null && (
                <span>dist: <span className="text-sp-info">{(reveal.clickDistance * 100).toFixed(0)}%</span> vs <span className="text-sp-success">{(reveal.trueDistance * 100).toFixed(0)}%</span></span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
