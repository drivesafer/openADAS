# OpenADAS Development Guidelines

**For AI Coding Assistants and Developers**

## Project Context

OpenADAS is a smartphone-based ADAS system targeting drivers in Vietnam/ASEAN. Key constraints:
- **Privacy-first**: All processing on-device, no cloud transmission
- **Assistive only**: Warnings, never autonomous control
- **Accessibility**: Works on mid-range smartphones from 2020+
- **Bilingual**: Vietnamese and English support required

---

## Technical Architecture

### Technology Stack
```
Frontend: Pure HTML5 + CSS3 + ES6+ JavaScript (no build tools)
AI/ML: TensorFlow.js + MediaPipe + COCO-SSD
Deployment: GitHub Pages (static hosting)
Runtime: Modern web browsers (mobile-optimized)
```

### Key Architectural Principles
1. **Zero Build Tools**: Direct browser execution, no npm/webpack/vite/bundlers
2. **Self-Contained Modes**: Each ADAS feature is an independent web app
3. **On-Device Processing**: All inference runs locally, no server dependencies
4. **Mobile-First**: Optimized for smartphone performance and battery life
5. **Progressive Enhancement**: Graceful degradation for older browsers

### Project Structure
```
openADAS/
├── index.html                    # Main mode picker (home page)
├── mode/
│   ├── traffic-sign/
│   │   └── index.html            # Traffic sign recognition mode
│   ├── lane-departure/           # Future: lane departure warning
│   └── _boilerplate/             # Future: template for new modes
├── assets/                       # Future: sample videos, icons
├── docs/                         # Future: detailed documentation
├── README.md                     # User-facing documentation
├── description.md                # Detailed project proposal/context
├── AGENTS.md                     # This file - AI assistant guidance
└── LICENSE                       # MIT License
```

### Mode Architecture
Each mode in `mode/*/` is a **standalone, single-file web application** containing:
- Complete HTML structure
- Embedded `<style>` block with CSS
- Embedded `<script>` block with JavaScript
- All dependencies loaded via CDN
- No external file dependencies within the mode

---

## Code Organization & Standards

### HTML Conventions
- **Document Structure**: Use HTML5 semantic elements (`<header>`, `<main>`, `<footer>`, `<section>`)
- **Meta Tags**: Always include viewport meta for mobile: `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`
- **Color Scheme**: Support system theme: `<meta name="color-scheme" content="light dark">`
- **Language**: Set appropriate lang attribute: `<html lang="vi">` or `<html lang="en">`

### CSS Standards
- Use CSS custom properties for theming (light/dark mode via `prefers-color-scheme`)
- Mobile-first responsive design (base styles for mobile, `@media (min-width: 720px)` for desktop)
- Handle safe areas for notch/island using `env(safe-area-inset-*)`
- Use semantic color names (--bg, --text, --muted, --border, --accent)

### JavaScript Standards
- Use ES6+ features: arrow functions, async/await, template literals, destructuring
- Never use `var`, always use `const` or `let`
- Model loading: async initialization with try/catch and user feedback
- Camera access: `getUserMedia` with `facingMode: "environment"` for rear camera, ideal resolution 1280x720
- Detection loops: use `requestAnimationFrame` (never `setInterval`)
- Canvas overlays: scale detection coordinates to match display dimensions
- Clear canvas between frames for clean overlays

### Performance Optimization
1. Use `requestAnimationFrame` for rendering loops (never `setInterval`)
2. Debounce detection events to prevent UI spam (track recent detections, compare positions)
3. Clear canvas between frames
4. Prefer lightweight models (COCO-SSD, MobileNet-based)
5. Throttle predictions if FPS drops below 15
6. Lazy-load models (initialize only when mode starts)
7. Dispose models when switching modes (`model.dispose()`)
8. Stop camera streams when exiting (`track.stop()` on all tracks)

---

## Bilingual Support (Vietnamese/English)

**Implementation Requirements:**
- Use dictionary-based approach with `vi` and `en` keys
- Auto-detect language from `navigator.language` (check for "vi" prefix)
- Persist language choice in `localStorage` with key `openadas_lang`
- Update `document.documentElement.lang` when language changes
- Use IDs prefixed with `t_` for translatable elements (e.g., `id="t_intro"`)
- Provide language toggle button labeled "VI / EN"
- Reference `index.html` for complete implementation pattern

---

## Creating New ADAS Modes

**Process:**
1. Create directory: `mode/my-new-mode/`
2. Copy `mode/traffic-sign/index.html` as starting template
3. Implement: model loading, camera access, detection loop, canvas overlays, bilingual UI
4. Add mode card to root `index.html` with unique class (e.g., `m4`), icon, and bilingual title/description IDs
5. Test on mobile devices (Android + iOS)

**Required Components:**
- Loading screen with status messages
- Error handling for camera access and model loading
- Start/stop controls
- Canvas overlays for detections
- Bilingual UI (VI/EN)
- Dark mode support via CSS custom properties
- Performance monitoring (FPS, detection count)

---

## AI/ML Model Guidelines

### Model Selection Criteria
1. Mobile-optimized (target: 15+ FPS on mid-range 2020+ phones)
2. Lightweight (<10MB, prefer quantized models)
3. On-device only (no cloud inference, no network requests)
4. Browser-compatible (TensorFlow.js or MediaPipe)
5. Proven accuracy (established models or thoroughly validated)

### Recommended Models
- Object Detection: COCO-SSD, MobileNet-SSD
- Face/Pose: MediaPipe Face Mesh, Pose Estimation
- Segmentation: BodyPix, MediaPipe Selfie Segmentation
- Custom Models: Convert to TensorFlow.js, quantize to INT8/FP16

### Best Practices
- Show loading screen during model initialization
- Update loading status text for user feedback
- Handle errors gracefully with clear messages
- Hide loader and enable UI only after successful load
- Dispose models when exiting mode (`model.dispose()`)
- Stop camera streams on cleanup
- Monitor FPS (calculate frames per second, display to user)

---

## Privacy & Responsible AI

### Non-Negotiable Rules
1. **NO** video/image transmission to servers - all processing on-device
2. **NO** data storage without explicit user consent
3. **NO** auto-start camera - require explicit user action (button press)
4. **Assistive warnings only** - never implement autonomous control
5. **Fail-safe design** - system failures must not cause danger

### Implementation Requirements
- Process video frames in memory only (never upload via `fetch()` or similar)
- If collecting metadata, require explicit consent and anonymize (no identifying info, no images, no location)
- Store minimal data in localStorage only

### Alert System
- Visual: High-contrast icons, minimum 60px for glance visibility
- Audio: Short, distinct sounds per alert type
- Frequency: Debounce 3-5 seconds between same alert
- Messages: Actionable and clear (e.g., "STOP SIGN AHEAD")

---

## Development Workflow

**No Build Step**: Edit HTML/CSS/JS directly, refresh browser to test.

**HTTPS Requirement**: Camera access requires HTTPS. Use `localhost` (secure context) or `npx http-server -S`.

**Browser Support**: Chrome 90+, Safari 14+, Edge 90+, Firefox 88+

**Performance Targets**:
- Model load: < 5s
- FPS: 15+ on mid-range phones (2020+)
- Memory: < 200MB
- Detection latency: < 100ms

**Testing Video Files**: Add file input (`accept="video/*"`), create object URL from file, set as video source

---

## Common Patterns

**Full-Screen Mobile Layout**: Flexbox body/html (100% height), absolute-positioned video/canvas centered with `transform: translate(-50%, -50%)`, `object-fit: cover`

**Overlay UI**: Absolute positioning with `pointer-events: none` for passthrough, re-enable on interactive elements with `pointer-events: auto`

**CDN Dependencies**: Load from jsdelivr.net - TensorFlow.js, COCO-SSD, MediaPipe

**State Management**: Simple state object with properties (isRunning, model, detectionCount, currentLang, lastDetections), update via `Object.assign()` and sync to UI

---

## Developer Guidelines

**Code Contribution Requirements**:
1. Follow existing patterns (vanilla HTML/CSS/JS)
2. No build tools or npm dependencies
3. Test on mobile devices (Android/iOS)
4. Bilingual support (VI/EN) for all UI text
5. Benchmark performance (maintain 15+ FPS)
6. Maintain privacy (on-device only)
7. Update AGENTS.md for new patterns

---

## AI Assistant Guidelines

When assisting with development:

1. **Never** suggest npm packages, webpack, or build processes
2. **Always** prioritize mobile over desktop
3. **Always** question any server/cloud communication
4. **Always** implement bilingual UI (VI/EN)
5. **Always** optimize for smartphone constraints
6. **Always** reference existing code patterns from `index.html` or `mode/traffic-sign/index.html`

**When uncertain**:
- Architecture: Follow zero-build-tool and on-device principles
- Privacy: Default to strictest interpretation (on-device only)
- Performance: Target 15+ FPS on mid-range 2020+ smartphones
- Patterns: Reference existing implementation files

---

## Reference Documentation

- **TensorFlow.js**: https://www.tensorflow.org/js
- **MediaPipe**: https://google.github.io/mediapipe/
- **COCO-SSD**: https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd
- **Web APIs**: getUserMedia, Canvas, LocalStorage, Web Audio
