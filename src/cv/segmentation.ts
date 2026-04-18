import type { HSVThreshold } from "./types";

export function applyRedMask(
  cv: any,
  hsv: any,
  mask1: any,
  mask2: any,
  mask: any,
  thr: HSVThreshold,
): void {
  const low1 = cv.matFromArray(1, 3, cv.CV_8U, [thr.h1[0], thr.sMin, thr.vMin]);
  const high1 = cv.matFromArray(1, 3, cv.CV_8U, [thr.h1[1], 255, 255]);
  const low2 = cv.matFromArray(1, 3, cv.CV_8U, [thr.h2[0], thr.sMin, thr.vMin]);
  const high2 = cv.matFromArray(1, 3, cv.CV_8U, [thr.h2[1], 255, 255]);

  cv.inRange(hsv, low1, high1, mask1);
  cv.inRange(hsv, low2, high2, mask2);
  cv.bitwise_or(mask1, mask2, mask);

  low1.delete();
  high1.delete();
  low2.delete();
  high2.delete();

  const K = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
  cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, K);
  K.delete();
}
