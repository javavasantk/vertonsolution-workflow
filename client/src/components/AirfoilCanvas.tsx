import { airfoilOutline, getChallenge } from "@shared/aeroforge";
import { useEffect, useRef } from "react";

type AirfoilCanvasProps = {
  challengeId?: string;
  mach?: number;
  alphaDeg?: number;
  className?: string;
  compact?: boolean;
};

/** Decorative yet mathematically-derived airflow visualisation. */
export function AirfoilCanvas({
  challengeId = "transonic-airfoil",
  mach = 0.42,
  alphaDeg = 3.5,
  className = "",
  compact = false,
}: AirfoilCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, rect.width, rect.height, challengeId, mach, alphaDeg, compact);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [challengeId, mach, alphaDeg, compact]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} aria-label="Airfoil flow contour visualisation" role="img" />;
}

function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  challengeId: string,
  mach: number,
  alphaDeg: number,
  compact: boolean
) {
  const challenge = getChallenge(challengeId);
  const alpha = (alphaDeg * Math.PI) / 180;
  const cx = width * 0.51;
  const cy = height * 0.53;
  const chord = width * (compact ? 0.61 : 0.58);
  const sy = chord * 0.56;
  const { upper, lower } = airfoilOutline(challenge.naca, 80);

  ctx.clearRect(0, 0, width, height);
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0d0c16");
  bg.addColorStop(1, "#171227");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // faint technical grid
  ctx.save();
  ctx.strokeStyle = "rgba(197,157,255,0.075)";
  ctx.lineWidth = 1;
  const grid = compact ? 22 : 28;
  for (let x = 0; x < width; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  ctx.restore();

  const transform = (point: [number, number]): [number, number] => {
    const x = (point[0] - 0.5) * chord;
    const y = -point[1] * sy;
    return [cx + x * Math.cos(alpha) - y * Math.sin(alpha), cy + x * Math.sin(alpha) + y * Math.cos(alpha)];
  };

  // Streamlines bend around the profile. More compression toward transonic M.
  const streamCount = compact ? 7 : 10;
  const surge = 10 + mach * 24;
  for (let i = 0; i < streamCount; i++) {
    const t = i / (streamCount - 1);
    const baseY = height * 0.15 + t * height * 0.7;
    const signed = (t - 0.5) * 2;
    const distFactor = Math.abs(signed);
    ctx.beginPath();
    for (let x = -20; x <= width + 20; x += 4) {
      const nx = x / width;
      const influence = Math.exp(-Math.pow((nx - 0.52) / 0.25, 2));
      const bend = -signed * surge * influence * (1 - distFactor * 0.65);
      const alphaShift = Math.sin((nx - 0.15) * Math.PI) * alpha * 11 * influence;
      const y = baseY + bend + alphaShift;
      if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = i === Math.floor(streamCount / 2) ? "rgba(197,157,255,0.35)" : "rgba(141,118,190,0.28)";
    ctx.lineWidth = 0.85;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // airfoil shadow
  ctx.save();
  ctx.filter = "blur(10px)";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  drawShape(ctx, upper, lower, transform, 0, 5);
  ctx.restore();

  // solid profile with violet/gold light cue
  const fill = ctx.createLinearGradient(cx - chord * 0.35, cy, cx + chord * 0.4, cy);
  fill.addColorStop(0, "#9f7bea");
  fill.addColorStop(0.6, "#d4a2ff");
  fill.addColorStop(1, mach > 0.72 ? "#d4af37" : "#c59dff");
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 0.75;
  drawShape(ctx, upper, lower, transform);
  ctx.fill();
  ctx.stroke();

  // stagnation point callout (full-size only)
  if (!compact) {
    const [sx, syPoint] = transform([0.02, 0]);
    ctx.fillStyle = "#d4af37";
    ctx.beginPath(); ctx.arc(sx, syPoint, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.font = "500 9px JetBrains Mono, monospace";
    ctx.fillStyle = "rgba(255,232,163,0.92)";
    ctx.fillText("Stagnation Point", sx + 7, syPoint - 8);
  }

  // supersonic-ish shock line
  if (mach > 0.73) {
    const [tx, ty] = transform([0.7, 0]);
    ctx.save();
    ctx.strokeStyle = "rgba(212,175,55,0.65)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(tx, ty - 44); ctx.lineTo(tx + 20, ty + 44); ctx.stroke();
    ctx.restore();
  }
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  upper: Array<[number, number]>,
  lower: Array<[number, number]>,
  transform: (point: [number, number]) => [number, number],
  dx = 0,
  dy = 0
) {
  ctx.beginPath();
  upper.forEach((p, i) => {
    const [x, y] = transform(p);
    if (i === 0) ctx.moveTo(x + dx, y + dy); else ctx.lineTo(x + dx, y + dy);
  });
  [...lower].reverse().forEach(p => {
    const [x, y] = transform(p);
    ctx.lineTo(x + dx, y + dy);
  });
  ctx.closePath();
}
