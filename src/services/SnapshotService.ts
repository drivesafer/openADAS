import type { Rect } from "@/sdk/types";

export const SnapshotService = {
  capture(
    video: HTMLVideoElement,
    scale = 0.45,
  ): HTMLCanvasElement | null {
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    if (!srcW || !srcH) return null;

    const s = scale > 0 && scale < 1 ? scale : 1;
    const w = Math.round(srcW * s);
    const h = Math.round(srcH * s);

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;

    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, srcW, srcH, 0, 0, w, h);
    return c;
  },

  crop(canvas: HTMLCanvasElement, rect: Rect): string {
    const out = document.createElement("canvas");
    out.width = rect.width;
    out.height = rect.height;
    out.getContext("2d")!.drawImage(
      canvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height,
    );
    return out.toDataURL("image/jpeg", 0.86);
  },

  expandRect(
    rect: Rect,
    frameW: number,
    frameH: number,
    padX?: number,
    padY?: number,
  ): Rect {
    const px = padX ?? Math.round(rect.width * 0.5);
    const py = padY ?? Math.round(rect.height * 1.0);
    const x = Math.max(0, rect.x - px);
    const y = Math.max(0, rect.y - py);
    const x2 = Math.min(frameW, rect.x + rect.width + px);
    const y2 = Math.min(frameH, rect.y + rect.height + py);
    return {
      x,
      y,
      width: Math.max(2, x2 - x),
      height: Math.max(2, y2 - y),
    };
  },
};
