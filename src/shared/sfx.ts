/**
 * UI Sound effects synthesized with Web Audio API.
 * ไม่ต้องโหลดไฟล์เสียง — สร้างเอง ใช้ได้แม้ไม่มี asset
 */

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

export function setSfxMuted(value: boolean) {
  muted = value;
}

export function isSfxMuted(): boolean {
  return muted;
}

interface BeepOptions {
  freq: number;
  endFreq?: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
  delayMs?: number;
}

function beep({ freq, endFreq, durationMs, type = "sine", gain = 0.18, delayMs = 0 }: BeepOptions) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const now = c.currentTime + delayMs / 1000;
  const dur = durationMs / 1000;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + dur);
  }
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export const sfx = {
  countdownTick() {
    beep({ freq: 660, durationMs: 90, type: "square", gain: 0.12 });
  },
  countdownGo() {
    beep({ freq: 990, durationMs: 220, type: "square", gain: 0.18 });
  },
  shot() {
    beep({ freq: 180, endFreq: 60, durationMs: 70, type: "sawtooth", gain: 0.08 });
  },
  hit() {
    beep({ freq: 880, endFreq: 1320, durationMs: 90, type: "triangle", gain: 0.15 });
  },
  perfectHit() {
    beep({ freq: 1320, endFreq: 1760, durationMs: 110, type: "triangle", gain: 0.2 });
    beep({ freq: 1760, endFreq: 2200, durationMs: 120, type: "triangle", gain: 0.13, delayMs: 80 });
  },
  miss() {
    beep({ freq: 220, endFreq: 110, durationMs: 140, type: "sawtooth", gain: 0.1 });
  },
  foul() {
    beep({ freq: 220, durationMs: 220, type: "square", gain: 0.18 });
    beep({ freq: 165, durationMs: 260, type: "square", gain: 0.16, delayMs: 180 });
    beep({ freq: 110, durationMs: 320, type: "square", gain: 0.14, delayMs: 400 });
  },
  matchComplete() {
    beep({ freq: 660, durationMs: 140, type: "triangle", gain: 0.15 });
    beep({ freq: 880, durationMs: 140, type: "triangle", gain: 0.15, delayMs: 120 });
    beep({ freq: 1320, durationMs: 220, type: "triangle", gain: 0.17, delayMs: 240 });
  },
  reveal(success: boolean) {
    if (success) {
      beep({ freq: 990, endFreq: 1320, durationMs: 160, type: "triangle", gain: 0.16 });
    } else {
      beep({ freq: 330, endFreq: 220, durationMs: 200, type: "sawtooth", gain: 0.12 });
    }
  },
  uiClick() {
    beep({ freq: 740, durationMs: 50, type: "square", gain: 0.08 });
  },
};
