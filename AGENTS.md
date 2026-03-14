# OpenADAS Development Guidelines

## Project Context

OpenADAS is an open-source, smartphone-based Advanced Driver Assistance System targeting drivers in Vietnam/ASEAN who lack access to built-in ADAS features. It runs directly in a mobile browser using the device camera, providing real-time safety alerts with no special hardware required.

**Key constraints:**
- **Privacy-first**: All processing on-device, no cloud transmission
- **Assistive only**: Warnings, never autonomous control
- **Accessibility**: Works on mid-range smartphones from 2020+
- **Bilingual**: Vietnamese and English support required
- **Live site**: https://openadas.io.vn (GitHub Pages via CNAME)

---

## Technical Architecture

### Technology Stack
```
Frontend:  Pure HTML5 + CSS3 + ES6+ JavaScript (no build tools)
CV Engine: OpenCV.js (loaded from CDN: docs.opencv.org/4.x/opencv.js)
Hosting:   GitHub Pages (static, custom domain via CNAME)
Runtime:   Modern mobile browsers
```

### Key Architectural Principles
1. **Zero Build Tools**: No npm, webpack, vite, or bundlers - direct browser execution
2. **Classical Computer Vision**: HSV color segmentation + contour analysis via OpenCV.js (not ML-based model inference)
3. **Self-Contained Modes**: Each ADAS feature is an independent web app under `mode/`
4. **On-Device Processing**: All inference runs locally via OpenCV.js, no server dependencies
5. **ES Modules**: Detection logic is separated into importable `.js` modules

### Mode Architecture
Each mode under `mode/*/` consists of:
- `index.html` - UI, layout, camera management, and application logic
- `detect.js` - Reusable detection module exported as ES module (`export function`)
- OpenCV.js loaded via CDN `<script>` tag
- Detection module imported via `<script type="module">`

---

## Code Standards

### HTML
- HTML5 semantic structure, viewport meta with `viewport-fit=cover`
- `<meta name="color-scheme" content="light dark">` on the mode picker
- Mode pages are dark-themed by default (driving context)
- OpenCV.js loaded via `<script async src="https://docs.opencv.org/4.x/opencv.js">`
- Detection modules loaded via `<script type="module">` with `import`

### CSS
- CSS custom properties for theming (--bg, --text, --muted, --border, --accent, --green)
- Mode picker (`index.html`): Light/dark auto via `prefers-color-scheme`, mobile-first with `720px` breakpoint
- Mode pages: Dark theme (driving at night), fullscreen viewport (`100vw`/`100vh`), no scroll (`overflow:hidden`)
- Safe area handling: `env(safe-area-inset-bottom)` for notch devices
- Glassmorphism panels: `backdrop-filter: blur()`, semi-transparent backgrounds

### JavaScript
- ES6+ with `const`/`let` (never `var`), async/await, arrow functions, destructuring, template literals
- ES Modules: `export function` in `detect.js`, `import` in `index.html`
- Detection loop via `requestAnimationFrame` (never `setInterval`)
- OpenCV.js readiness: Poll `window.cv && cv.Mat` with `setInterval` then resolve a Promise
- Camera: `getUserMedia({ video: { facingMode: "environment" } })`, explicit `video.play()` and `waitVideoReady()`
- Mat lifecycle: Always `delete()` temporary Mats, use `free()` cleanup on stop
- Canvas sizing must match `video.videoWidth`/`video.videoHeight` exactly (OpenCV.js `VideoCapture` reads from video element attributes)

### Performance
- `requestAnimationFrame` for rendering loops
- Temporal persistence to filter false positives (require N-of-M frames)
- Debounce pin creation with cooldown timers
- Cluster window to group nearby detections
- Limit stored snapshots and pin cards (cap arrays, remove oldest)
- Dispose all OpenCV Mats on stop or error (prevent memory leaks)
- Camera resolution: 640x480 (balance between detection quality and performance)

---

## Creating New Modes

1. Create directory: `mode/my-new-mode/`
2. Create `detect.js` with detection logic exported as a factory function
3. Create `index.html` that loads OpenCV.js (or other CV library) and imports `detect.js` as ES module
4. Add mode card to root `index.html` (follow existing card pattern with accent color class, icon, bilingual title/description IDs)
5. Add bilingual entries to the `dict` object in root `index.html`

**Required components per mode:**
- OpenCV.js readiness polling before initialization
- Camera permission request with error handling
- Camera selector if multiple cameras available
- Detection loop using `requestAnimationFrame`
- Proper Mat allocation/disposal lifecycle
- Visual feedback (bounding boxes, pins, or overlays)
- Start/stop or pause/resume controls

---

## Privacy & Responsible AI

### Non-Negotiable Rules
1. **NO** video/image transmission to servers
2. **NO** data storage without explicit user consent
3. **NO** auto-start camera - require explicit user action
4. **Assistive warnings only** - never implement autonomous control
5. **Fail-safe**: System failure must not create danger (detection stops gracefully on error, attempts reinit next frame)

---

## Development Workflow

**No build step**: Edit files directly, refresh browser to test.

**HTTPS required**: Camera access requires HTTPS or `localhost`. Use `npx http-server -S` for local HTTPS.

**OpenCV.js dependency**: Loaded from CDN at runtime. Ensure `waitOpenCV()` polling pattern before any `cv.*` calls.

**Browser support**: Chrome 90+, Safari 14+, Edge 90+, Firefox 88+

**Testing**: Mode-specific debug/tuning variants may exist alongside production code (see each mode's AGENTS.md for details).

---

## AI Assistant Guidelines

When assisting with this codebase:

1. **Never** suggest npm, webpack, or build tools
2. **Never** introduce ML model inference (TensorFlow.js, ONNX, etc.) without discussion - the current approach is classical CV via OpenCV.js
3. **Always** manage OpenCV Mat lifecycle (allocate, use, `delete()`) - memory leaks are the primary risk
4. **Always** sync `video.width`/`video.height` attributes with `video.videoWidth`/`video.videoHeight` before `VideoCapture.read()` - size mismatch causes OpenCV errors
5. **Always** use `requestAnimationFrame` for detection loops
6. **Always** handle errors in the detection loop gracefully (catch, free Mats, attempt recovery next frame)
7. **Always** reference existing mode implementations for patterns (e.g., `mode/traffic-sign/`)

**When uncertain:**
- CV approach: Follow classical computer vision patterns (HSV, contours, morphology)
- Privacy: Default to strictest interpretation (on-device only)
- Performance: Target smooth operation at 640x480 on mobile
- Architecture: Keep detection logic in `detect.js` modules, UI/app logic in `index.html`
