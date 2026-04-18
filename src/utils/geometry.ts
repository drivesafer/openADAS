import type { Rect } from "@/sdk/types";

export function expandRect(
  r: Rect,
  frameW: number,
  frameH: number,
  padXFrac = 0.5,
  padYFrac = 1.0,
): Rect {
  const padX = Math.round(r.width * padXFrac);
  const padY = Math.round(r.height * padYFrac);
  const x = Math.max(0, r.x - padX);
  const y = Math.max(0, r.y - padY);
  const x2 = Math.min(frameW, r.x + r.width + padX);
  const y2 = Math.min(frameH, r.y + r.height + padY);
  return { x, y, width: Math.max(2, x2 - x), height: Math.max(2, y2 - y) };
}

export function unionRects(rects: Rect[]): Rect {
  let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
  for (const r of rects) {
    x1 = Math.min(x1, r.x);
    y1 = Math.min(y1, r.y);
    x2 = Math.max(x2, r.x + r.width);
    y2 = Math.max(y2, r.y + r.height);
  }
  return { x: x1, y: y1, width: Math.max(2, x2 - x1), height: Math.max(2, y2 - y1) };
}
