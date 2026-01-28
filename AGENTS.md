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
**Use CSS Custom Properties for theming:**
```css
:root {
  --bg: #f7f7f8;
  --text: #111214;
  --muted: rgba(17,18,20,.75);
  --border: rgba(20,20,20,.14);
  --accent: #2563eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0f14;
    --text: #f2f5f7;
    --muted: rgba(242,245,247,.78);
    --border: rgba(255,255,255,.14);
  }
}
```

**Mobile-First Responsive Design:**
```css
/* Base styles for mobile */
.container {
  padding: 18px;
}

/* Desktop overrides */
@media (min-width: 720px) {
  .container {
    padding: 24px;
  }
}
```

**Safe Area Handling for Notch/Island:**
```css
.wrap {
  padding-bottom: calc(18px + env(safe-area-inset-bottom));
}
```

### JavaScript Standards

**Use Modern ES6+ Features:**
- Arrow functions: `const myFunc = () => {}`
- Async/await for asynchronous operations
- Template literals: `` `Hello ${name}` ``
- Destructuring: `const {x, y, width, height} = bbox;`
- Const/let (never var)

**Model Loading Pattern:**
```javascript
let model = null;

async function init() {
  try {
    model = await cocoSsd.load();
    // Update UI to show ready state
  } catch (err) {
    // Graceful error handling with user feedback
    console.error(err);
  }
}
```

**Camera Access Pattern:**
```javascript
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: "environment",  // Rear camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera access denied or not available. Ensure you are using HTTPS.");
  }
}
```

**Detection Loop Pattern (using requestAnimationFrame):**
```javascript
async function detectFrame() {
  if (!isRunning) return;
  
  const predictions = await model.detect(video);
  
  // Process predictions
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  predictions.forEach(prediction => {
    if (prediction.score > 0.5) {
      drawBoundingBox(prediction);
    }
  });
  
  requestAnimationFrame(detectFrame);
}
```

**Canvas Scaling for Overlays:**
```javascript
function drawBoundingBox(prediction) {
  const [x, y, width, height] = prediction.bbox;
  
  // Scale detection coords to display coords
  const scaleX = canvas.width / video.videoWidth;
  const scaleY = canvas.height / video.videoHeight;
  
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 4;
  ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
}
```

### Performance Optimization

**Critical Performance Guidelines:**
1. **Use requestAnimationFrame** for all rendering loops (never setInterval)
2. **Debounce detection events** to prevent UI spam and excessive processing
3. **Clear canvas between frames**: `ctx.clearRect(0, 0, canvas.width, canvas.height)`
4. **Prefer lightweight models**: COCO-SSD, MobileNet-based architectures
5. **Throttle predictions** if FPS drops below 15fps
6. **Lazy-load models**: Only initialize when user starts a mode
7. **Dispose of models**: Call `model.dispose()` when switching modes

**Debouncing Example:**
```javascript
let lastDetections = [];

function handleNewDetection(prediction) {
  const now = Date.now();
  const isDuplicate = lastDetections.some(d => 
    d.class === prediction.class && 
    Math.abs(d.bbox[0] - prediction.bbox[0]) < 50
  );
  
  if (!isDuplicate) {
    addToGallery(prediction);
    lastDetections.push({ ...prediction, time: now });
    if (lastDetections.length > 5) lastDetections.shift();
  }
}
```

---

## Bilingual Support (Vietnamese/English)

### Implementation Pattern
All text must support both Vietnamese and English using a dictionary-based approach.

**Dictionary Structure:**
```javascript
const dict = {
  vi: {
    intro: "OpenADAS là hệ thống hỗ trợ lái xe...",
    startBtn: "Bắt đầu",
    stopBtn: "Dừng lại"
  },
  en: {
    intro: "OpenADAS is a driver assistance system...",
    startBtn: "Start",
    stopBtn: "Stop"
  }
};
```

**Language Detection & Persistence:**
```javascript
// Auto-detect from browser
const auto = (navigator.language || "").startsWith("vi") ? "vi" : "en";

// Load from localStorage or use auto-detected
const lang = localStorage.getItem("openadas_lang") || auto;

// Apply language
function setLang(l) {
  const t = dict[l];
  document.documentElement.lang = l;
  document.getElementById("t_intro").innerHTML = t.intro;
  // ... update all text elements
  localStorage.setItem("openadas_lang", l);
}
```

**HTML Element Structure:**
```html
<p id="t_intro">Default text (will be replaced)</p>
<button id="t_startBtn">Start</button>
```

### Language Toggle Button
Always provide a language switcher:
```html
<button class="lang" id="langBtn">VI / EN</button>
```

```javascript
document.getElementById("langBtn").onclick = function() {
  lang = lang === "vi" ? "en" : "vi";
  setLang(lang);
};
```

---

## Creating New ADAS Modes

1. Create directory: `mkdir -p mode/my-new-mode`
2. Copy `mode/traffic-sign/index.html` as reference
3. Implement: model loading, camera access, detection loop, overlays, bilingual UI
4. Add card to root `index.html`:
   ```html
   <a class="card m4" href="./mode/my-new-mode/index.html">
     <div class="row">
       <div class="accent"></div>
       <div class="icon">🚨</div>
       <div>
         <p class="title" id="t_m4">Mode Name</p>
         <p class="desc" id="t_d4">Mode description.</p>
       </div>
     </div>
   </a>
   ```
5. Test on mobile devices

**Required components**: Loading screen, error handling, start/stop controls, overlays, bilingual UI (VI/EN), dark mode, performance monitoring

---

## AI/ML Model Guidelines

### Model Selection Criteria
1. **Mobile-Optimized**: Must run efficiently on smartphones (target: 15+ FPS)
2. **Lightweight**: Prefer quantized models (<10MB)
3. **On-Device Only**: No cloud inference, no network requests for predictions
4. **Browser-Compatible**: Must work with TensorFlow.js or MediaPipe
5. **Proven Accuracy**: Use established models or thoroughly validated custom models

### Recommended Models
- **Object Detection**: COCO-SSD, MobileNet-SSD
- **Face/Pose Detection**: MediaPipe Face Mesh, Pose Estimation
- **Segmentation**: BodyPix, MediaPipe Selfie Segmentation
- **Custom Models**: Convert to TensorFlow.js format, quantize to INT8/FP16

### Model Loading Best Practices
```javascript
// Show loading screen
const loader = document.getElementById('loader');

async function loadModel() {
  try {
    // Update status for user feedback
    document.getElementById('load-status').innerText = "Loading model...";
    
    const model = await tf.loadLayersModel('path/to/model.json');
    // OR
    const model = await cocoSsd.load();
    
    // Hide loader
    loader.classList.add('hidden');
    return model;
  } catch (err) {
    document.getElementById('load-status').innerText = 
      "Error: Check HTTPS and network connection.";
    console.error('Model loading failed:', err);
    throw err;
  }
}
```

### Model Disposal
```javascript
// When user exits mode or switches modes
function cleanup() {
  if (model) {
    model.dispose();
    model = null;
  }
  // Stop camera stream
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
}
```

### Performance Monitoring
```javascript
let frameCount = 0;
let lastTime = Date.now();

function updateFPS() {
  frameCount++;
  const now = Date.now();
  if (now - lastTime > 1000) {
    const fps = Math.round(frameCount * 1000 / (now - lastTime));
    document.getElementById('fps').innerText = `${fps} FPS`;
    frameCount = 0;
    lastTime = now;
  }
}
```

---

## Privacy & Responsible AI Implementation

### Non-Negotiable Rules
1. **NO video/image transmission to servers** - All processing must be on-device
2. **NO data storage without explicit user consent** - Don't save frames, detections, or logs automatically
3. **Camera access requires clear user action** - No auto-start, always require button press
4. **Assistive warnings only** - Never implement autonomous control or intervention
5. **Fail-safe design** - System failure must not cause dangerous situations

### Privacy-Preserving Patterns

**Video Processing:**
```javascript
// ✅ GOOD: Process in memory only
async function detectFrame() {
  const predictions = await model.detect(video);
  // Process predictions...
  // Video data never leaves this function
}

// ❌ BAD: Don't do this
function uploadFrame() {
  canvas.toBlob(blob => {
    fetch('/api/analyze', { method: 'POST', body: blob }); // NO!
  });
}
```

**Optional Data Collection (if needed):**
```javascript
// Only with explicit user consent
function saveAnonymizedMetadata() {
  if (!userConsentGiven) return;
  
  const metadata = {
    timestamp: Date.now(),
    detectionCount: count,
    // NO identifying information
    // NO images or video
    // NO location data
  };
  localStorage.setItem('stats', JSON.stringify(metadata));
}
```

### Alert System Guidelines
- **Visual**: High-contrast icons, min 60px for glance visibility
- **Audio**: Short, distinct sounds per alert type
- **Frequency**: Debounce 3-5 seconds between same alert type
- **Clarity**: Actionable messages ("STOP SIGN AHEAD" not "Object detected")

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

**Testing Video Files**:
```javascript
<input type="file" accept="video/*" id="videoFile">

document.getElementById('videoFile').onchange = function(e) {
  const file = e.target.files[0];
  video.src = URL.createObjectURL(file);
  video.play();
  startDetection();
};
```

---

## Common Code Patterns

### Full-Screen Mobile Layout
```css
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#container {
  position: relative;
  flex-grow: 1;
  width: 100%;
  overflow: hidden;
}

video, canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Overlay UI Pattern
```css
#ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px;
  z-index: 10;
  pointer-events: none; /* Let touches pass through */
  background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%);
}

.button {
  pointer-events: auto; /* Re-enable for interactive elements */
}
```

### CDN Dependencies
```html
<!-- TensorFlow.js -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>

<!-- COCO-SSD Model -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd"></script>

<!-- MediaPipe (future) -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils"></script>
```

### State Management Pattern
```javascript
// Simple state object
const state = {
  isRunning: false,
  model: null,
  detectionCount: 0,
  currentLang: 'en',
  lastDetections: []
};

// State update with UI sync
function updateState(updates) {
  Object.assign(state, updates);
  syncUI();
}

function syncUI() {
  document.getElementById('count').innerText = state.detectionCount;
  document.getElementById('status').innerText = state.isRunning ? 'Running' : 'Stopped';
}
```

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
