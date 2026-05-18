import { SoundType } from "../types";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface AudioBundle {
  context: AudioContext;
  masterGain: GainNode;
  /** noise buffer cache — สร้างครั้งเดียว ใช้ซ้ำได้ ประหยัด CPU */
  brownNoise: AudioBuffer;
  whiteNoise: AudioBuffer;
}

function createNoiseBuffer(context: AudioContext, durationSec: number, color: "brown" | "white"): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * durationSec));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  if (color === "white") {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else {
    // Brown noise: low-pass integrated white noise — สำหรับฝีเท้า body
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.025 * white) / 1.025;
      data[i] = last * 3.4;
    }
  }
  return buffer;
}

export async function createAudioBundle(): Promise<AudioBundle> {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  // ดังขึ้นชัดเจน (เดิม 0.72) — กันคลิป headroom เหลือพอ
  masterGain.gain.value = 0.92;
  masterGain.connect(context.destination);

  if (context.state === "suspended") {
    await context.resume();
  }

  // สร้าง noise buffer ไว้ใช้ซ้ำ
  const brownNoise = createNoiseBuffer(context, 1.0, "brown");
  const whiteNoise = createNoiseBuffer(context, 0.5, "white");

  return { context, masterGain, brownNoise, whiteNoise };
}

export async function ensureAudioReady(
  existing: AudioBundle | null
): Promise<AudioBundle> {
  // ถ้า context เคยถูก close ไป → สร้างใหม่
  if (existing && existing.context.state === "closed") {
    return createAudioBundle();
  }

  const bundle = existing ?? (await createAudioBundle());

  if (bundle.context.state === "suspended") {
    await bundle.context.resume();
  }

  return bundle;
}

export function angleToPosition(angleDeg: number, distance01: number) {
  const radians = (angleDeg * Math.PI) / 180;
  // ลด range เล็กน้อย เพื่อให้ HRTF panner ทำงานในระยะที่ได้ยินชัด
  const radius = 1.0 + distance01 * 2.2;

  return {
    x: Math.cos(radians) * radius,
    y: 0,
    z: Math.sin(radians) * radius,
  };
}

function connectSpatialChain(
  bundle: AudioBundle,
  angleDeg: number,
  distance01: number
) {
  const { context, masterGain } = bundle;
  const panner = context.createPanner();
  const gain = context.createGain();
  const position = angleToPosition(angleDeg, distance01);

  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.maxDistance = 8;
  panner.rolloffFactor = 1.2;
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 360;
  panner.positionX.value = position.x;
  panner.positionY.value = position.y;
  panner.positionZ.value = position.z;

  // เพิ่ม min volume ของเสียงไกล: เดิม 0.08 → 0.32
  // ทำให้เสียงไกลยังได้ยินชัด แต่ก็ยังมี dynamic range พอจะแยกใกล้/ไกลได้
  gain.gain.value = Math.max(0.32, 1.15 - distance01 * 0.78);
  panner.connect(gain);
  gain.connect(masterGain);

  return { input: panner, gain };
}

/**
 * ฝีเท้า — ใช้ brown noise filtered low ให้มี body
 * ความยาว ~280ms (นานกว่าเดิม 70%) ทำให้สมองมีเวลา localize
 * Broadband content → HRTF ทำงานดีขึ้นมาก
 */
function playFootstep(bundle: AudioBundle, angleDeg: number, distance01: number) {
  const { context, brownNoise } = bundle;
  const { input } = connectSpatialChain(bundle, angleDeg, distance01);
  const now = context.currentTime;
  const dur = 0.32;

  const src = context.createBufferSource();
  src.buffer = brownNoise;
  src.playbackRate.value = 0.85 + Math.random() * 0.3; // วาริเอชั่นเล็กน้อย

  // Bandpass filter ให้เสียงมี body ของฝีเท้า
  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 420;
  lowpass.Q.value = 0.8;

  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 80;
  highpass.Q.value = 0.5;

  // Envelope: punch ตอนต้น + tail ยาวพอให้ฟังออกทิศ
  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(2.2, now + 0.012);
  env.gain.exponentialRampToValueAtTime(0.6, now + 0.08);
  env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(env);
  env.connect(input);

  src.start(now);
  src.stop(now + dur + 0.05);
}

/**
 * Reload click — bandpass noise ที่ความถี่กลาง-สูง
 * ความยาว ~220ms ฟังออกชัดขึ้น (เดิม ~80ms)
 */
function playReload(bundle: AudioBundle, angleDeg: number, distance01: number) {
  const { context, whiteNoise } = bundle;
  const { input } = connectSpatialChain(bundle, angleDeg, distance01);
  const now = context.currentTime;
  const dur = 0.24;

  const src = context.createBufferSource();
  src.buffer = whiteNoise;

  // Bandpass ที่ ~1.8kHz ให้เสียง metallic click
  const bp = context.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 2.5;

  // Envelope: 2 จังหวะ click-click
  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(2.0, now + 0.006);
  env.gain.exponentialRampToValueAtTime(0.3, now + 0.06);
  env.gain.exponentialRampToValueAtTime(1.4, now + 0.1);
  env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(bp);
  bp.connect(env);
  env.connect(input);

  src.start(now);
  src.stop(now + dur + 0.05);
}

export function playSpatialSound(
  bundle: AudioBundle,
  angleDeg: number,
  distance01: number,
  soundType: SoundType
) {
  // ป้องกัน error ถ้า context ถูก close ไประหว่างเล่น
  if (bundle.context.state === "closed") return;
  if (soundType === "reload") {
    playReload(bundle, angleDeg, distance01);
  } else {
    playFootstep(bundle, angleDeg, distance01);
  }
}
