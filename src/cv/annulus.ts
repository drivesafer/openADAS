import type { RingThresholds } from "./types";

export function annulusScore(
  mask: any,
  cx: number,
  cy: number,
  r: number,
  W: number,
  H: number,
  thresholds: RingThresholds,
): { ringFrac: number; centerFrac: number } {
  const thick = Math.max(2, Math.round(r * thresholds.thickFrac));
  const rIn = Math.max(2, r - thick);
  const rOut = r + thick;

  let ringT = 0, ringR = 0;
  const ang = 48, rs = 3;
  for (let a = 0; a < ang; a++) {
    const t = (a / ang) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    for (let k = 0; k < rs; k++) {
      const rr = rIn + (k / (rs - 1)) * (rOut - rIn);
      const x = Math.round(cx + rr * ct);
      const y = Math.round(cy + rr * st);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      ringT++;
      if (mask.ucharAt(y, x) > 0) ringR++;
    }
  }
  const ringFrac = ringT ? ringR / ringT : 0;

  let cenT = 0, cenR = 0;
  const cR = Math.max(2, Math.round(r * 0.45));
  const step = Math.max(2, Math.round(cR / 6));
  for (let yy = -cR; yy <= cR; yy += step) {
    for (let xx = -cR; xx <= cR; xx += step) {
      if (xx * xx + yy * yy > cR * cR) continue;
      const x = Math.round(cx + xx);
      const y = Math.round(cy + yy);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      cenT++;
      if (mask.ucharAt(y, x) > 0) cenR++;
    }
  }
  const centerFrac = cenT ? cenR / cenT : 1;

  return { ringFrac, centerFrac };
}
