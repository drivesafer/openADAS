// detect.js
// Lean red-ring traffic sign detector using OpenCV.js
// - HSV red mask (2 bands because red wraps at hue 0/180)
// - Adaptive HSV: auto day/night + loose/med/tight/ultra + statistical anchors
// - Robust ring detection even when red blob attaches to other red objects:
//    (A) hierarchy ring (outer contour with child hole)
//    (B) fallback: circle fit + annulus sampling score
// - Persistence (temporal filtering)

export function createRedRingDetector({
  video,
  outputCanvas,
  maskCanvas,
  getUIConfig = () => ({ profile: "auto", tightness: "med" }),
  onStatus = () => {}
}) {
  // --- Persistence ---
  const detectionHistory = [];
  const MAX_HISTORY = 6;
  const MIN_OCCURRENCE = 3;
  const DISTANCE_THRESHOLD = 40;

  // --- Mats / state ---
  let cap, src, dst, rgb, hsv, mask1, mask2, mask;
  let contours, hierarchy;
  let running = false;

  // --- Statistical anchors (tune these from your dataset if you want) ---
  const ANCHOR = {
    day:   { lumaMean: 140, sMean:  75, vMean: 135 },
    night: { lumaMean:  80, sMean:  95, vMean: 120 }
  };

  // --- Base HSV presets (before adaptive adjustment) ---
  const PRESET = {
    day: {
      loose: { sMin:  90, vMin:  40, h1:[0,18],  h2:[162,180] },
      med:   { sMin: 110, vMin:  55, h1:[0,16],  h2:[164,180] },
      tight: { sMin: 130, vMin:  70, h1:[0,15],  h2:[165,180] },
      ultra: { sMin: 150, vMin:  85, h1:[0,13],  h2:[167,180] }
    },
    night: {
      loose: { sMin:  70, vMin:  25, h1:[0,20],  h2:[160,180] },
      med:   { sMin:  95, vMin:  40, h1:[0,18],  h2:[162,180] },
      tight: { sMin: 120, vMin:  55, h1:[0,16],  h2:[164,180] },
      ultra: { sMin: 140, vMin:  70, h1:[0,14],  h2:[166,180] }
    }
  };

  // --- Robust ring scoring thresholds (tune if needed) ---
  const RING = {
    minOuterArea: 700,          // outer red area threshold
    // hierarchy ring (outer + hole)
    outerCircularityMin: 0.55,  // allow worse circle because it may attach to pole
    outerCircularityMax: 1.30,
    holeCircularityMin: 0.70,   // keep hole stricter (hole usually cleaner)
    ringnessMin: 0.18,          // holeArea / outerArea
    ringnessMax: 0.85,
    aspectMin: 0.65,            // allow more deformation due to attachment
    aspectMax: 1.35,
    // circle-fit fallback
    minRadius: 18,              // px
    annulusThicknessFrac: 0.14, // thickness ~ r*0.14 (both sides)
    annulusRedMin: 0.58,        // >= this fraction of samples are red on ring
    centerRedMax: 0.22          // <= this fraction of samples are red in center disk
  };

  // --- Helpers ---
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function initMats() {
    const w = video.videoWidth || video.width;
    const h = video.videoHeight || video.height;

    outputCanvas.width = w; outputCanvas.height = h;
    maskCanvas.width = w; maskCanvas.height = h;

    src = new cv.Mat(h, w, cv.CV_8UC4);
    dst = new cv.Mat(h, w, cv.CV_8UC4);
    rgb = new cv.Mat(h, w, cv.CV_8UC3);
    hsv = new cv.Mat(h, w, cv.CV_8UC3);

    mask1 = new cv.Mat();
    mask2 = new cv.Mat();
    mask  = new cv.Mat();

    contours = new cv.MatVector();
    hierarchy = new cv.Mat();

    cap = new cv.VideoCapture(video);
  }

  function freeMats() {
    [src,dst,rgb,hsv,mask1,mask2,mask,contours,hierarchy].forEach(m => {
      if (m && !m.isDeleted?.()) m.delete();
    });
    src=dst=rgb=hsv=mask1=mask2=mask=contours=hierarchy=null;
    cap=null;
  }

  // fast stats via downsample
  function computeFrameStats() {
    const step = 8;
    const w = src.cols, h = src.rows;
    let sumL = 0, sumS = 0, sumV = 0, n = 0;

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const p = src.ucharPtr(y, x); // RGBA
        const r = p[0], g = p[1], b = p[2];
        const l = (r * 77 + g * 150 + b * 29) >> 8; // 0..255 approx luma

        const q = hsv.ucharPtr(y, x); // HSV
        sumL += l; sumS += q[1]; sumV += q[2]; n++;
      }
    }
    return { lumaMean: sumL / n, sMean: sumS / n, vMean: sumV / n };
  }

  function pickProfile(stats, uiProfile) {
    if (uiProfile === "day" || uiProfile === "night") return uiProfile;
    return stats.lumaMean < 105 ? "night" : "day";
  }

  function adaptiveHSV(stats, profile, tightness) {
    const base = PRESET[profile][tightness];
    const anchor = ANCHOR[profile];

    const dl = clamp((anchor.lumaMean - stats.lumaMean) / 80, -1.0, 1.0);
    const ds = clamp((anchor.sMean - stats.sMean) / 80,   -1.0, 1.0);
    const dv = clamp((anchor.vMean - stats.vMean) / 80,   -1.0, 1.0);

    let sMin = base.sMin + Math.round((-ds * 10) + (dl * -15));
    let vMin = base.vMin + Math.round((dl * -25) + (-dv * 10));

    sMin = clamp(sMin, 40, 200);
    vMin = clamp(vMin, 10, 200);

    return { h1: base.h1, h2: base.h2, sMin, vMin };
  }

  function rectFromCircle(cx, cy, r, w, h) {
    const x = clamp(Math.round(cx - r), 0, w - 1);
    const y = clamp(Math.round(cy - r), 0, h - 1);
    const x2 = clamp(Math.round(cx + r), 0, w - 1);
    const y2 = clamp(Math.round(cy + r), 0, h - 1);
    return { x, y, width: Math.max(1, x2 - x), height: Math.max(1, y2 - y) };
  }

  // Count "red" on ring & in center by sampling binary mask around circle.
  // mask is 0 or 255.
  function annulusScore(maskMat, cx, cy, r) {
    const w = maskMat.cols, h = maskMat.rows;
    const thick = Math.max(2, Math.round(r * RING.annulusThicknessFrac));
    const rIn = Math.max(2, r - thick);
    const rOut = r + thick;

    // ring samples
    let ringTotal = 0, ringRed = 0;
    const angles = 48; // lean but decent
    const radialSteps = 3;
    for (let a = 0; a < angles; a++) {
      const t = (a / angles) * (Math.PI * 2);
      const ct = Math.cos(t), st = Math.sin(t);
      for (let k = 0; k < radialSteps; k++) {
        const rr = rIn + (k / (radialSteps - 1)) * (rOut - rIn);
        const x = Math.round(cx + rr * ct);
        const y = Math.round(cy + rr * st);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        ringTotal++;
        if (maskMat.ucharAt(y, x) > 0) ringRed++;
      }
    }
    const ringFrac = ringTotal ? (ringRed / ringTotal) : 0;

    // center samples (grid inside a disk)
    let centerTotal = 0, centerRed = 0;
    const cR = Math.max(2, Math.round(r * 0.45));
    const step = Math.max(2, Math.round(cR / 6)); // ~small grid
    for (let yy = -cR; yy <= cR; yy += step) {
      for (let xx = -cR; xx <= cR; xx += step) {
        if (xx*xx + yy*yy > cR*cR) continue;
        const x = Math.round(cx + xx);
        const y = Math.round(cy + yy);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        centerTotal++;
        if (maskMat.ucharAt(y, x) > 0) centerRed++;
      }
    }
    const centerFrac = centerTotal ? (centerRed / centerTotal) : 1;

    return { ringFrac, centerFrac };
  }

  // Hierarchy ring test: outer contour with a child hole
  function tryRingHierarchy(contours, hierarchyMat) {
    const found = [];

    // hierarchy is 1 x N x 4 (next, prev, first_child, parent)
    for (let i = 0; i < contours.size(); i++) {
      const hptr = hierarchyMat.intPtr(0, i);
      const child = hptr[2];
      const parent = hptr[3];
      if (parent !== -1 || child === -1) continue; // only outer contours with a hole

      const outer = contours.get(i);
      const outerArea = cv.contourArea(outer);
      if (outerArea < RING.minOuterArea) { outer.delete(); continue; }

      const outerPeri = cv.arcLength(outer, true);
      if (outerPeri <= 1) { outer.delete(); continue; }
      const outerCirc = (4 * Math.PI * outerArea) / (outerPeri * outerPeri);
      const outerRect = cv.boundingRect(outer);
      const outerAspect = outerRect.width / outerRect.height;

      // child hole contour
      const hole = contours.get(child);
      const holeArea = cv.contourArea(hole);
      const holePeri = cv.arcLength(hole, true);
      const holeCirc = holePeri > 1 ? ((4 * Math.PI * holeArea) / (holePeri * holePeri)) : 0;

      const ringness = holeArea / Math.max(1, outerArea);

      // Filter: loosen outer shape, tighten hole shape
      const ok =
        outerCirc >= RING.outerCircularityMin && outerCirc <= RING.outerCircularityMax &&
        outerAspect >= RING.aspectMin && outerAspect <= RING.aspectMax &&
        holeCirc >= RING.holeCircularityMin &&
        ringness >= RING.ringnessMin && ringness <= RING.ringnessMax;

      if (ok) {
        found.push({
          // use outerRect for bbox (it naturally includes any attachment, but that's okay)
          rect: outerRect,
          x: outerRect.x + outerRect.width * 0.5,
          y: outerRect.y + outerRect.height * 0.5,
          // small score so we can rank
          score: holeCirc * 0.6 + outerCirc * 0.4
        });
      }

      hole.delete();
      outer.delete();
    }

    // return best few (or empty)
    found.sort((a,b) => b.score - a.score);
    return found;
  }

  // Fallback: circle fit + annulus scoring
  function tryCircleFallback(contours) {
    const found = [];

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area < RING.minOuterArea) { cnt.delete(); continue; }

      const circle = cv.minEnclosingCircle(cnt);
      const cx = circle.center.x;
      const cy = circle.center.y;
      const r = circle.radius;

      if (r < RING.minRadius) { cnt.delete(); continue; }

      // score ring signature from binary mask
      const { ringFrac, centerFrac } = annulusScore(mask, cx, cy, r);

      if (ringFrac >= RING.annulusRedMin && centerFrac <= RING.centerRedMax) {
        const rect = rectFromCircle(cx, cy, r, mask.cols, mask.rows);
        found.push({
          rect,
          x: cx,
          y: cy,
          score: (ringFrac - centerFrac) // bigger is better
        });
      }

      cnt.delete();
    }

    found.sort((a,b) => b.score - a.score);
    return found;
  }

  function processFrame() {
    if (!running) return;

    try {
      cap.read(src);
      src.copyTo(dst);

      // 1) Blur + HSV
      cv.GaussianBlur(src, src, new cv.Size(7,7), 0, 0, cv.BORDER_DEFAULT);
      cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
      cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);

      // 2) Stats + adaptive HSV
      const ui = getUIConfig();
      const stats = computeFrameStats();
      const profile = pickProfile(stats, ui.profile);
      const thr = adaptiveHSV(stats, profile, ui.tightness);

      // 3) Red segmentation (2 bands)
      const low1  = cv.matFromArray(1,3,cv.CV_8U, [thr.h1[0], thr.sMin, thr.vMin]);
      const high1 = cv.matFromArray(1,3,cv.CV_8U, [thr.h1[1], 255,      255]);
      const low2  = cv.matFromArray(1,3,cv.CV_8U, [thr.h2[0], thr.sMin, thr.vMin]);
      const high2 = cv.matFromArray(1,3,cv.CV_8U, [thr.h2[1], 255,      255]);

      cv.inRange(hsv, low1, high1, mask1);
      cv.inRange(hsv, low2, high2, mask2);
      cv.bitwise_or(mask1, mask2, mask);

      low1.delete(); high1.delete(); low2.delete(); high2.delete();

      // 4) Morphology close (connect ring)
      const Kc = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5,5));
      cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, Kc);
      Kc.delete();

      // Optional (VERY LIGHT) anti-attachment open:
      // This can help break thin pole connections but may hurt small signs.
      // Uncomment if you want:
      // const Ko = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3,3));
      // cv.morphologyEx(mask, mask, cv.MORPH_OPEN, Ko);
      // Ko.delete();

      // 5) Contours with hierarchy (IMPORTANT PATCH)
      contours.delete(); contours = new cv.MatVector();
      hierarchy.delete(); hierarchy = new cv.Mat();

      // RETR_CCOMP gives 2-level hierarchy: outer contours + holes
      cv.findContours(mask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

      // (A) Ring hierarchy candidates
      let candidates = tryRingHierarchy(contours, hierarchy);

      // (B) Fallback circle-fit if none
      if (candidates.length === 0) {
        candidates = tryCircleFallback(contours);
      }

      // Keep only top few to reduce duplicates
      candidates = candidates.slice(0, 6);

      // 6) Persistence
      detectionHistory.push(candidates);
      if (detectionHistory.length > MAX_HISTORY) detectionHistory.shift();

      for (const cand of candidates) {
        let seen = 0;
        for (const frame of detectionHistory) {
          if (frame.some(p => Math.hypot(p.x - cand.x, p.y - cand.y) < DISTANCE_THRESHOLD)) {
            seen++;
          }
        }

        if (seen >= MIN_OCCURRENCE) {
          const p1 = new cv.Point(cand.rect.x, cand.rect.y);
          const p2 = new cv.Point(cand.rect.x + cand.rect.width, cand.rect.y + cand.rect.height);
          cv.rectangle(dst, p1, p2, [0,255,0,255], 3);
          cv.putText(
            dst,
            "TRAFFIC SIGN",
            new cv.Point(cand.rect.x, Math.max(0, cand.rect.y - 10)),
            cv.FONT_HERSHEY_SIMPLEX,
            0.6,
            [0,255,0,255],
            2
          );
        }
      }

      // 7) Display
      cv.imshow(outputCanvas, dst);
      cv.imshow(maskCanvas, mask);

      // (optional) status line - keep off for max FPS
      // onStatus(`${profile} | ${ui.tightness} | Smin=${thr.sMin} Vmin=${thr.vMin} | L=${stats.lumaMean.toFixed(0)}`);

    } catch (e) {
      console.error("Frame Processing Error:", e);
      onStatus("Processing error (see console).");
    }

    requestAnimationFrame(processFrame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      initMats();
      onStatus("System Active: Detecting...");
      requestAnimationFrame(processFrame);
    },
    stop() {
      running = false;
      freeMats();
      onStatus("Stopped.");
    }
  };
}