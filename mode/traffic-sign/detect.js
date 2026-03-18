// traffic-sign/detect.js
// Red-ring detector only.
// Source selection / debug-file logic is intentionally moved to ../fake-camera/detect.js

export function createRedRingDetector({
  video,
  outputCanvas,
  getUIConfig = () => ({ profile: "day", tightness: "med" }),
  onStatus = () => {},
  debug = true,
  debugEveryMs = 800
}) {
  const hist = [];
  const MAX_HISTORY = 6;
  const MIN_OCCURRENCE = 3;
  const DIST = 40;

  let cap, src, dst, rgb, hsv, mask1, mask2, mask, contours, hierarchy;
  let running = false;
  let W = 0, H = 0;

  let lastLogTs = 0;
  function logSize(tag, extra = {}) {
    if (!debug) return;
    const t = performance.now();
    if (t - lastLogTs < debugEveryMs) return;
    lastLogTs = t;

    console.log(`[cvsize] ${tag}`, {
      video_videoWidth: video.videoWidth,
      video_videoHeight: video.videoHeight,
      video_attr_width: video.width,
      video_attr_height: video.height,
      mat_W: W,
      mat_H: H,
      src_cols: src?.cols,
      src_rows: src?.rows,
      outCanvas_w: outputCanvas?.width,
      outCanvas_h: outputCanvas?.height,
      ...extra
    });
  }

  const ANCHOR = {
    day: { l: 140, s: 75, v: 135 },
    night: { l: 80, s: 95, v: 120 }
  };

  const PRESET = {
    day: {
      loose: { s: 90, v: 40, h1: [0, 18], h2: [162, 180] },
      med:   { s: 110, v: 55, h1: [0, 16], h2: [164, 180] },
      tight: { s: 130, v: 70, h1: [0, 15], h2: [165, 180] },
      ultra: { s: 150, v: 85, h1: [0, 13], h2: [167, 180] }
    },
    night: {
      loose: { s: 70, v: 25, h1: [0, 20], h2: [160, 180] },
      med:   { s: 95, v: 40, h1: [0, 18], h2: [162, 180] },
      tight: { s: 120, v: 55, h1: [0, 16], h2: [164, 180] },
      ultra: { s: 140, v: 70, h1: [0, 14], h2: [166, 180] }
    }
  };

  const R = {
    minArea: 700,
    outerCircMin: 0.55, outerCircMax: 1.30,
    holeCircMin: 0.70,
    ringnessMin: 0.18, ringnessMax: 0.85,
    aspectMin: 0.65, aspectMax: 1.35,
    minRadius: 18,
    thickFrac: 0.14,
    annulusRedMin: 0.58,
    centerRedMax: 0.22
  };

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function free() {
    [src, dst, rgb, hsv, mask1, mask2, mask, contours, hierarchy].forEach(m => {
      if (m && !m.isDeleted?.()) m.delete();
    });
    src = dst = rgb = hsv = mask1 = mask2 = mask = contours = hierarchy = null;
    cap = null;
    W = 0;
    H = 0;
  }

  function initForSize(w, h) {
    free();

    W = w;
    H = h;
    outputCanvas.width = W;
    outputCanvas.height = H;

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
    logSize("initForSize()");
  }

  function getAndSyncVideoAttrSize() {
    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;

    if (!vw || !vh) return { ready: false, w: 0, h: 0 };

    if (video.width !== vw) video.width = vw;
    if (video.height !== vh) video.height = vh;

    return { ready: true, w: video.width, h: video.height };
  }

  function ensureSizeMatch() {
    const s = getAndSyncVideoAttrSize();
    if (!s.ready) {
      logSize("video not ready");
      return false;
    }

    if (!src || s.w !== W || s.h !== H) {
      initForSize(s.w, s.h);
      return false;
    }

    if (src.cols !== s.w || src.rows !== s.h) {
      logSize("SANITY mismatch before read", { s });
      initForSize(s.w, s.h);
      return false;
    }

    return true;
  }

  function frameStats() {
    const step = 8;
    let sumL = 0, sumS = 0, sumV = 0, n = 0;

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const p = src.ucharPtr(y, x);
        const l = (p[0] * 77 + p[1] * 150 + p[2] * 29) >> 8;
        const q = hsv.ucharPtr(y, x);
        sumL += l;
        sumS += q[1];
        sumV += q[2];
        n++;
      }
    }

    return { l: sumL / n, s: sumS / n, v: sumV / n };
  }

  function adaptive(stats, profile, tightness) {
    const base = PRESET[profile][tightness];
    const a = ANCHOR[profile];
    const dl = clamp((a.l - stats.l) / 80, -1, 1);
    const ds = clamp((a.s - stats.s) / 80, -1, 1);
    const dv = clamp((a.v - stats.v) / 80, -1, 1);

    let sMin = base.s + Math.round((-ds * 10) + (dl * -15));
    let vMin = base.v + Math.round((dl * -25) + (-dv * 10));
    sMin = clamp(sMin, 40, 200);
    vMin = clamp(vMin, 10, 200);

    return { h1: base.h1, h2: base.h2, sMin, vMin };
  }

  function annulusScore(cx, cy, r) {
    const thick = Math.max(2, Math.round(r * R.thickFrac));
    const rIn = Math.max(2, r - thick);
    const rOut = r + thick;

    let ringT = 0, ringR = 0;
    const ang = 48, rs = 3;
    for (let a = 0; a < ang; a++) {
      const t = (a / ang) * Math.PI * 2;
      const ct = Math.cos(t);
      const st = Math.sin(t);

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

  function rectFromCircle(cx, cy, r) {
    const x = clamp(Math.round(cx - r), 0, W - 1);
    const y = clamp(Math.round(cy - r), 0, H - 1);
    const x2 = clamp(Math.round(cx + r), 0, W - 1);
    const y2 = clamp(Math.round(cy + r), 0, H - 1);
    return { x, y, width: Math.max(2, x2 - x), height: Math.max(2, y2 - y) };
  }

  function ringHierarchy() {
    const out = [];

    for (let i = 0; i < contours.size(); i++) {
      const hp = hierarchy.intPtr(0, i);
      const child = hp[2];
      const parent = hp[3];
      if (parent !== -1 || child === -1) continue;

      const outer = contours.get(i);
      const areaO = cv.contourArea(outer);
      if (areaO < R.minArea) {
        outer.delete();
        continue;
      }

      const periO = cv.arcLength(outer, true);
      if (periO <= 1) {
        outer.delete();
        continue;
      }

      const circO = (4 * Math.PI * areaO) / (periO * periO);
      const rectO = cv.boundingRect(outer);
      const asp = rectO.width / rectO.height;

      const hole = contours.get(child);
      const areaH = cv.contourArea(hole);
      const periH = cv.arcLength(hole, true);
      const circH = (periH > 1) ? (4 * Math.PI * areaH) / (periH * periH) : 0;
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
          score: circH * 0.6 + circO * 0.4
        });
      }

      hole.delete();
      outer.delete();
    }

    out.sort((a, b) => b.score - a.score);
    return out;
  }

  function circleFallback() {
    const out = [];

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area < R.minArea) {
        cnt.delete();
        continue;
      }

      const c = cv.minEnclosingCircle(cnt);
      const r = c.radius;
      if (r < R.minRadius) {
        cnt.delete();
        continue;
      }

      const { ringFrac, centerFrac } = annulusScore(c.center.x, c.center.y, r);
      if (ringFrac >= R.annulusRedMin && centerFrac <= R.centerRedMax) {
        out.push({
          rect: rectFromCircle(c.center.x, c.center.y, r),
          x: c.center.x,
          y: c.center.y,
          score: ringFrac - centerFrac
        });
      }

      cnt.delete();
    }

    out.sort((a, b) => b.score - a.score);
    return out;
  }

  function stableFrom(cands) {
    hist.push(cands);
    if (hist.length > MAX_HISTORY) hist.shift();

    const stable = [];
    for (const c of cands) {
      let seen = 0;
      for (const f of hist) {
        if (f.some(p => Math.hypot(p.x - c.x, p.y - c.y) < DIST)) {
          seen++;
        }
      }
      if (seen >= MIN_OCCURRENCE) stable.push(c);
    }
    return stable;
  }

  function loop() {
    if (!running) return;

    try {
      if (!ensureSizeMatch()) {
        requestAnimationFrame(loop);
        return;
      }

      logSize("before cap.read()");
      cap.read(src);
      src.copyTo(dst);

      cv.GaussianBlur(src, src, new cv.Size(7, 7), 0, 0, cv.BORDER_DEFAULT);
      cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
      cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);

      const ui = getUIConfig();
      const stats = frameStats();
      const thr = adaptive(stats, ui.profile, ui.tightness);

      const low1  = cv.matFromArray(1, 3, cv.CV_8U, [thr.h1[0], thr.sMin, thr.vMin]);
      const high1 = cv.matFromArray(1, 3, cv.CV_8U, [thr.h1[1], 255, 255]);
      const low2  = cv.matFromArray(1, 3, cv.CV_8U, [thr.h2[0], thr.sMin, thr.vMin]);
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

      contours.delete();
      contours = new cv.MatVector();
      hierarchy.delete();
      hierarchy = new cv.Mat();

      cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

      let cands = ringHierarchy();
      if (!cands.length) cands = circleFallback();
      cands = cands.slice(0, 6);

      const stable = stableFrom(cands);

      for (const s of stable) {
        const p1 = new cv.Point(s.rect.x, s.rect.y);
        const p2 = new cv.Point(s.rect.x + s.rect.width, s.rect.y + s.rect.height);
        cv.rectangle(dst, p1, p2, [0, 255, 0, 255], 3);
      }

      cv.imshow(outputCanvas, dst);

      if (typeof api.onStable === 'function') {
        api.onStable(stable);
      }
    } catch (e) {
      console.error("[cvsize] ERROR", e);
      logSize("ERROR snapshot");
      free();
    }

    requestAnimationFrame(loop);
  }

  const api = {
    onStable: null,
    start() {
      if (running) return;
      running = true;
      onStatus("running");
      requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      free();
      onStatus("stopped");
    }
  };

  return api;
}
