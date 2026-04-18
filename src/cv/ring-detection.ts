import type { Detection, RingThresholds } from "./types";
import { annulusScore } from "./annulus";

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function rectFromCircle(cx: number, cy: number, r: number, W: number, H: number) {
  const x = clamp(Math.round(cx - r), 0, W - 1);
  const y = clamp(Math.round(cy - r), 0, H - 1);
  const x2 = clamp(Math.round(cx + r), 0, W - 1);
  const y2 = clamp(Math.round(cy + r), 0, H - 1);
  return { x, y, width: Math.max(2, x2 - x), height: Math.max(2, y2 - y) };
}

export function ringHierarchy(
  cv: any,
  contours: any,
  hierarchy: any,
  R: RingThresholds,
): Detection[] {
  const out: Detection[] = [];
  for (let i = 0; i < contours.size(); i++) {
    const hp = hierarchy.intPtr(0, i);
    const child = hp[2], parent = hp[3];
    if (parent !== -1 || child === -1) continue;

    const outer = contours.get(i);
    const areaO = cv.contourArea(outer);
    if (areaO < R.minArea) { outer.delete(); continue; }

    const periO = cv.arcLength(outer, true);
    if (periO <= 1) { outer.delete(); continue; }
    const circO = (4 * Math.PI * areaO) / (periO * periO);
    const rectO = cv.boundingRect(outer);
    const asp = rectO.width / rectO.height;

    const hole = contours.get(child);
    const areaH = cv.contourArea(hole);
    const periH = cv.arcLength(hole, true);
    const circH = periH > 1 ? (4 * Math.PI * areaH) / (periH * periH) : 0;
    const ringness = areaH / Math.max(1, areaO);

    const ok =
      circO >= R.outerCircMin && circO <= R.outerCircMax &&
      asp >= R.aspectMin && asp <= R.aspectMax &&
      circH >= R.holeCircMin &&
      ringness >= R.ringnessMin && ringness <= R.ringnessMax;

    if (ok) {
      out.push({
        rect: rectO,
        x: rectO.x + rectO.width * 0.5,
        y: rectO.y + rectO.height * 0.5,
        score: circH * 0.6 + circO * 0.4,
      });
    }

    hole.delete();
    outer.delete();
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

export function circleFallback(
  cv: any,
  contours: any,
  mask: any,
  W: number,
  H: number,
  R: RingThresholds,
): Detection[] {
  const out: Detection[] = [];
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    if (area < R.minArea) { cnt.delete(); continue; }

    const c = cv.minEnclosingCircle(cnt);
    const r = c.radius;
    if (r < R.minRadius) { cnt.delete(); continue; }

    const { ringFrac, centerFrac } = annulusScore(mask, c.center.x, c.center.y, r, W, H, R);
    if (ringFrac >= R.annulusRedMin && centerFrac <= R.centerRedMax) {
      out.push({
        rect: rectFromCircle(c.center.x, c.center.y, r, W, H),
        x: c.center.x,
        y: c.center.y,
        score: ringFrac - centerFrac,
      });
    }
    cnt.delete();
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
