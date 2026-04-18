import { ANCHOR, PRESET } from "./presets";
import type { FrameStats, HSVThreshold } from "./types";

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export function computeFrameStats(
  src: any,
  hsv: any,
  W: number,
  H: number,
): FrameStats {
  const step = 8;
  let sumL = 0, sumS = 0, sumV = 0, n = 0;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const p = src.ucharPtr(y, x);
      const l = (p[0] * 77 + p[1] * 150 + p[2] * 29) >> 8;
      const q = hsv.ucharPtr(y, x);
      sumL += l;
      sumS += q[1]!;
      sumV += q[2]!;
      n++;
    }
  }
  return { l: sumL / n, s: sumS / n, v: sumV / n };
}

export function pickProfile(
  stats: FrameStats,
  uiProfile: string,
): "day" | "night" {
  if (uiProfile === "day" || uiProfile === "night") return uiProfile;
  return stats.l < 105 ? "night" : "day";
}

export function adaptiveHSV(
  stats: FrameStats,
  profile: "day" | "night",
  tightness: "loose" | "med" | "tight" | "ultra",
): HSVThreshold {
  const base = PRESET[profile][tightness];
  const a = ANCHOR[profile];

  const dl = clamp((a.l - stats.l) / 80, -1, 1);
  const ds = clamp((a.s - stats.s) / 80, -1, 1);
  const dv = clamp((a.v - stats.v) / 80, -1, 1);

  let sMin = base.s + Math.round(-ds * 10 + dl * -15);
  let vMin = base.v + Math.round(dl * -25 + -dv * 10);
  sMin = clamp(sMin, 40, 200);
  vMin = clamp(vMin, 10, 200);

  return { h1: [...base.h1], h2: [...base.h2], sMin, vMin };
}
