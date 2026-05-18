import { MAGAZINE_SIZE } from "../config";

type Props = { size?: number; magSize?: number };

/** Preview ของ recoil pattern แสดงในหน้า Idle ให้ผู้เล่นเห็นทิศทางที่กระสุนจะดีด */
export function GhostRecoilPreview({ size = 130, magSize = MAGAZINE_SIZE }: Props) {
  const rawPoints = Array.from({ length: magSize }).map((_, i) => {
    const idx = i + 1;
    const vy = -(idx * 8.4 + Math.pow(idx, 1.18) * 1.85);
    const vx =
      Math.sin(idx * 0.85) * Math.min(48, idx * 2.2) +
      Math.sin(idx * 0.27 + 1.4) * Math.min(28, idx * 1.15);
    return { vx, vy };
  });

  const maxAbsX = Math.max(1, ...rawPoints.map((p) => Math.abs(p.vx)));
  const maxAbsY = Math.max(1, ...rawPoints.map((p) => Math.abs(p.vy)));
  const padding = 8;
  const usableW = size - padding * 2;
  const usableH = size - padding * 2;
  const scale = Math.min(usableW / (maxAbsX * 2), usableH / maxAbsY);
  const cx = size / 2;
  const cy = size - padding;

  const points = rawPoints.map((p) => ({
    x: cx + p.vx * scale,
    y: cy + p.vy * scale,
  }));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <circle cx={cx} cy={cy} r={Math.max(4, scale * 58)} fill="none" stroke="rgb(251 113 133 / 0.4)" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx={cx} cy={cy} r={Math.max(2, scale * 24)} fill="none" stroke="rgb(52 211 153 / 0.6)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="2.5" fill="rgb(251 113 133)" />
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="rgb(251 113 133 / 0.6)"
        strokeWidth="1.2"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.4} fill="rgb(251 113 133 / 0.8)" opacity={0.35 + (i / magSize) * 0.55} />
      ))}
    </svg>
  );
}
