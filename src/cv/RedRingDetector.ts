import type { Detection, UIConfig, ROIConfig } from "./types";
import { RING_DEFAULTS } from "./presets";
import { computeFrameStats, pickProfile, adaptiveHSV } from "./adaptive";
import { applyRedMask } from "./segmentation";
import { ringHierarchy, circleFallback } from "./ring-detection";
import { TemporalFilter } from "./persistence";

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export interface DetectorConfig {
  video: HTMLVideoElement;
  outputCanvas: HTMLCanvasElement;
  maskCanvas?: HTMLCanvasElement;
  roi?: ROIConfig;
  frameSkip?: number;
  statsEveryN?: number;
  getUIConfig: () => UIConfig;
  onStable?: (detections: Detection[]) => void;
  debug?: boolean;
  drawLabels?: boolean;
}

export function createRedRingDetector(config: DetectorConfig) {
  const {
    video,
    outputCanvas,
    maskCanvas,
    roi,
    frameSkip = 1,
    statsEveryN = 2,
    getUIConfig,
    debug = false,
    drawLabels = false,
  } = config;

  const R = RING_DEFAULTS;
  const persistence = new TemporalFilter();

  let cap: any, src: any, dst: any, rgb: any, hsv: any;
  let mask1: any, mask2: any, mask: any, contours: any, hierarchy: any;
  let running = false;
  let W = 0, H = 0;
  let frameCounter = 0;
  let statsCounter = 0;
  let cachedStats: { l: number; s: number; v: number } | null = null;

  function free() {
    [src, dst, rgb, hsv, mask1, mask2, mask, contours, hierarchy].forEach((m) => {
      try { if (m && !m.isDeleted?.()) m.delete(); } catch { /* noop */ }
    });
    src = dst = rgb = hsv = mask1 = mask2 = mask = contours = hierarchy = null;
    cap = null;
    W = 0;
    H = 0;
  }

  function initForSize(w: number, h: number) {
    free();
    W = w;
    H = h;
    outputCanvas.width = W;
    outputCanvas.height = H;
    if (maskCanvas) {
      maskCanvas.width = W;
      maskCanvas.height = H;
    }

    src = new cv.Mat(H, W, cv.CV_8UC4);
    dst = new cv.Mat(H, W, cv.CV_8UC4);
    rgb = new cv.Mat(H, W, cv.CV_8UC3);
    hsv = new cv.Mat(H, W, cv.CV_8UC3);
    mask1 = new cv.Mat();
    mask2 = new cv.Mat();
    mask = new cv.Mat();
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cap = new cv.VideoCapture(video);
  }

  function ensureSizeMatch(): boolean {
    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (!vw || !vh) return false;

    if (video.width !== vw) video.width = vw;
    if (video.height !== vh) video.height = vh;

    if (!src || vw !== W || vh !== H) {
      initForSize(vw, vh);
      return false;
    }
    if (src.cols !== vw || src.rows !== vh) {
      initForSize(vw, vh);
      return false;
    }
    return true;
  }

  function loop() {
    if (!running) return;

    try {
      frameCounter++;
      if (frameSkip > 0 && frameCounter % (frameSkip + 1) !== 0) {
        requestAnimationFrame(loop);
        return;
      }

      if (!ensureSizeMatch()) {
        requestAnimationFrame(loop);
        return;
      }

      cap.read(src);
      src.copyTo(dst);

      let processingSrc = src;
      let processingHsv = hsv;
      let processingRgb = rgb;
      let roiY = 0;
      let srcROI: any = null, dstROI: any = null, rgbROI: any = null, hsvROI: any = null;

      if (roi) {
        const topFrac = clamp(roi.topFraction, 0, 0.9);
        const hFrac = clamp(roi.heightFraction, 0.1, 1.0);
        roiY = Math.round(H * topFrac);
        const roiH = Math.min(Math.round(H * hFrac), H - roiY);
        const roiRect = new cv.Rect(0, roiY, W, roiH);

        srcROI = src.roi(roiRect);
        dstROI = dst.roi(roiRect);
        rgbROI = rgb.roi(roiRect);
        hsvROI = hsv.roi(roiRect);
        processingSrc = srcROI;
        processingHsv = hsvROI;
        processingRgb = rgbROI;
      }

      cv.GaussianBlur(processingSrc, processingSrc, new cv.Size(7, 7), 0, 0, cv.BORDER_DEFAULT);
      cv.cvtColor(processingSrc, processingRgb, cv.COLOR_RGBA2RGB);
      cv.cvtColor(processingRgb, processingHsv, cv.COLOR_RGB2HSV);

      const ui = getUIConfig();

      statsCounter++;
      if (!cachedStats || statsCounter >= Math.max(1, statsEveryN)) {
        cachedStats = computeFrameStats(processingSrc, processingHsv, W, roi ? Math.round(H * (roi.heightFraction || 0.7)) : H);
        statsCounter = 0;
      }

      const profile = pickProfile(cachedStats, ui.profile);
      const thr = adaptiveHSV(cachedStats, profile, ui.tightness);

      applyRedMask(cv, processingHsv, mask1, mask2, mask, thr);

      contours.delete();
      contours = new cv.MatVector();
      hierarchy.delete();
      hierarchy = new cv.Mat();
      cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

      let cands = ringHierarchy(cv, contours, hierarchy, R);
      if (!cands.length) cands = circleFallback(cv, contours, mask, W, roi ? Math.round(H * (roi.heightFraction || 0.7)) : H, R);
      cands = cands.slice(0, 6);

      const stable = persistence.filter(cands);

      for (const s of stable) {
        if (roi) s.rect.y += roiY;
        const p1 = new cv.Point(s.rect.x, s.rect.y);
        const p2 = new cv.Point(s.rect.x + s.rect.width, s.rect.y + s.rect.height);
        cv.rectangle(dst, p1, p2, [0, 255, 0, 255], 3);

        if (drawLabels) {
          cv.putText(
            dst,
            "TRAFFIC SIGN",
            new cv.Point(s.rect.x, Math.max(0, s.rect.y - 10)),
            cv.FONT_HERSHEY_SIMPLEX,
            0.6,
            [0, 255, 0, 255],
            2,
          );
        }
      }

      if (srcROI) srcROI.delete();
      if (dstROI) dstROI.delete();
      if (rgbROI) rgbROI.delete();
      if (hsvROI) hsvROI.delete();

      cv.imshow(outputCanvas, dst);
      if (maskCanvas) cv.imshow(maskCanvas, mask);

      if (typeof api.onStable === "function") api.onStable(stable);
    } catch (e) {
      if (debug) console.error("[RedRingDetector] Error:", e);
      free();
    }

    requestAnimationFrame(loop);
  }

  const api = {
    onStable: config.onStable ?? null,
    start() {
      if (running) return;
      running = true;
      persistence.reset();
      cachedStats = null;
      frameCounter = 0;
      statsCounter = 0;
      requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      free();
    },
  };

  return api;
}
