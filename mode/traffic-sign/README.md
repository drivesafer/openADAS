# Traffic Sign Detection — Development Guidelines

## Detection Engine

The traffic sign detector uses **classical computer vision** via OpenCV.js (not ML models).

### Pipeline Overview
1. **Camera capture** via `cv.VideoCapture` bound to a `<video>` element
2. **Preprocessing**: Gaussian blur, RGBA-to-RGB, RGB-to-HSV conversion
3. **Adaptive HSV thresholding**: Two hue bands (red wraps at 0/180 in HSV), with saturation/value thresholds adjusted based on frame luminance statistics
4. **Morphology**: Close operation to connect ring segments
5. **Contour detection**: `cv.findContours` with `RETR_CCOMP` for 2-level hierarchy
6. **Ring detection** (two strategies):
   - (A) **Hierarchy ring**: Outer contour with a child hole — checks circularity, aspect ratio, and ringness (hole/outer area ratio)
   - (B) **Circle fallback**: `minEnclosingCircle` + annulus sampling — checks red density on ring vs center
7. **Temporal persistence**: Candidate must appear in >= 3 of last 6 frames within a distance threshold
8. **Visualization**: Green bounding box drawn on output canvas via `cv.imshow`

### detect.js Module API
The detector is created via factory function:
```
createRedRingDetector({ video, outputCanvas, getUIConfig, onStatus }) => { start(), stop(), onStable }
```
- `getUIConfig()` returns `{ profile: "day"|"night", tightness: "loose"|"med"|"tight"|"ultra" }`
- `onStable(stableDetections)` callback fires each frame with temporally-stable detections
- Each detection has: `{ rect: {x,y,width,height}, x, y, score }`

### Critical Implementation Details
- **Mat lifecycle**: Always `delete()` temporary Mats. Use `free()` cleanup on stop or error. Memory leaks are the primary risk.
- **Video size sync**: `video.width`/`video.height` attributes must match `video.videoWidth`/`video.videoHeight` before `VideoCapture.read()` — size mismatch causes OpenCV errors
- **Error recovery**: Catch errors in the detection loop, call `free()`, and let `requestAnimationFrame` retry next frame with re-initialization

---

## Production vs Debug Variants

- **`mode/traffic-sign/`** (this folder): Production UI with pin-based UX. When a tracked sign disappears from the frame, it gets cropped and "pinned" to the screen. Settings panel with camera selector and day/night mode.
- **`mode/traffic-sign test:tune model/`**: Debug/tuning UI with dual canvas (detection output + binary mask), profile and tightness dropdowns. Used for parameter tuning during development.

### Pin Tracking System (Production)
- **Track state**: Detections are tracked across frames with a cluster window for grouping nearby signs
- **Pin trigger**: When a tracked sign is no longer detected for several consecutive frames (miss threshold), and the track lasted long enough (minimum duration), a cropped snapshot is pinned
- **Snapshot selection**: Picks a frame from ~70% through the track duration for best quality
- **Crop expansion**: Bounding rect is expanded with padding before cropping
- **Cooldown**: Minimum delay between consecutive pins to prevent spam
- **Pin limit**: Maximum 5 pins displayed, oldest removed first

---

## Tuning Parameters

### HSV Thresholds
Profiles (`day`/`night`) and tightness levels (`loose`/`med`/`tight`/`ultra`) control base saturation and value minimums. Adaptive adjustment shifts these based on frame luminance, saturation, and value statistics relative to anchor values.

### Ring Detection Thresholds
Key constants in `detect.js` (tune if detection accuracy changes):
- `minArea` / `minOuterArea`: Minimum contour area to consider
- `outerCircularityMin/Max`: Circularity bounds for outer contour
- `holeCircularityMin`: Minimum circularity for inner hole
- `ringnessMin/Max`: Hole-to-outer area ratio bounds
- `aspectMin/Max`: Bounding rect aspect ratio bounds
- `annulusRedMin`: Minimum red density on ring annulus (fallback method)
- `centerRedMax`: Maximum red density in center disk (fallback method)

### Tracking Constants
- `TRACK_MIN_MS`: Minimum track duration before pinning (220ms)
- `MISS_FRAMES_TO_END`: Consecutive miss frames to end a track (8)
- `PIN_COOLDOWN_MS`: Minimum delay between pins (1200ms)
- `CLUSTER_WINDOW_MS`: Time window for grouping nearby signs (700ms)
