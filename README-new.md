# OpenADAS

**OpenADAS** is an open-source, smartphone-based Advanced Driver Assistance System (ADAS) that runs directly in a mobile browser. It uses the device camera and classical computer vision (via OpenCV.js) to provide real-time driving safety alerts — no special hardware, no cloud processing, no data leaving your device.

> **Make ADAS accessible, transparent, and community-driven — especially for everyday drivers in Vietnam and ASEAN.**

**Live site:** [beta.openadas.io.vn](https://beta.openadas.io.vn)

---

## Key Features

- **Runs on any modern smartphone** — Chrome, Safari, Edge, Firefox
- **Privacy-first** — all processing on-device, zero cloud transmission
- **Assistive only** — warnings and alerts, never autonomous control
- **Extensible** — micro-frontend architecture with a Mini App SDK for community contributions
- **Offline-capable** — PWA with Service Worker caching
- **Bilingual** — Vietnamese and English, with extensible language support

---

## Available Mini Apps

| App | Description | Status |
|-----|-------------|--------|
| **Traffic Sign Recognition** | Detects red-ring traffic signs in real time using HSV segmentation and contour analysis | Production |
| **Traffic Sign (Tune/Debug)** | Dual-canvas debug view with adjustable HSV profiles and tightness | Production |
| **Lane Departure Warning** | Warns when the vehicle drifts out of its lane | Placeholder |
| **Signs + Lane Departure** | Combined traffic sign and lane departure detection | Placeholder |

Community-contributed mini apps can be installed from remote URLs via the Marketplace.

---

## Architecture

OpenADAS uses a **micro-frontend shell architecture**. The shell application provides routing, theming, i18n, and common services. Mini apps are independently developed modules that plug into the shell via a framework-agnostic SDK.

```
Shell (React 19 + Vite 6)
├── Mini App SDK          — MiniAppManifest, MiniAppLifecycle, MiniAppContext
├── Common Services       — OpenCV, Camera, Detection Loop, Mat Lifecycle,
│                           i18n, Theme, Storage, Notifications, Snapshot
├── Registry System       — IndexedDB store, built-in + remote app support
├── Service Worker        — Workbox precaching, mini app bundle caching
└── Mini Apps             — First-party (in-repo) + community (remote URL)
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Build Tool | Vite 6 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| i18n | react-i18next |
| CV Engine | OpenCV.js (CDN, classical computer vision) |
| Storage | IndexedDB via idb-keyval |
| PWA | vite-plugin-pwa + Workbox |
| Language | TypeScript (strict mode) |
| Hosting | GitHub Pages |

---

## Project Structure

```
openADAS/
├── public/
│   ├── CNAME                          # Custom domain
│   ├── 404.html                       # SPA fallback for GitHub Pages
│   └── registry.json                  # Built-in mini app registry
├── src/
│   ├── main.tsx                       # Shell entry point
│   ├── App.tsx                        # Router + providers
│   ├── app.css                        # Tailwind + custom theme tokens
│   │
│   ├── sdk/                           # Mini App SDK
│   │   ├── types.ts                   # MiniAppManifest, Lifecycle, Context
│   │   ├── context.ts                 # Assembles services into MiniAppContext
│   │   ├── MiniAppAdapter.tsx         # Mounts any mini app into React
│   │   └── createReactMiniApp.tsx     # Convenience wrapper for React mini apps
│   │
│   ├── services/                      # Common Services (9 services)
│   │   ├── OpenCVService.ts           # CDN loading, readiness polling
│   │   ├── CameraService.ts           # getUserMedia, device management
│   │   ├── DetectionLoopService.ts    # rAF loop with frame skip
│   │   ├── MatLifecycleService.ts     # OpenCV Mat tracking + disposal
│   │   ├── I18nService.ts             # Thin i18next wrapper for SDK
│   │   ├── ThemeService.ts            # Light/dark + forced dark
│   │   ├── StorageService.ts          # Namespaced IndexedDB
│   │   ├── NotificationService.ts     # Status bar + toasts
│   │   └── SnapshotService.ts         # Canvas capture + crop utilities
│   │
│   ├── registry/                      # Mini App Registry
│   │   ├── RegistryStore.ts           # IndexedDB-backed store
│   │   ├── builtins.ts               # First-party app manifests
│   │   ├── RemoteLoader.ts            # Fetch + validate remote manifests
│   │   ├── InstallManager.ts          # Install/uninstall + SW cache
│   │   └── useRegistry.ts             # React hook
│   │
│   ├── cv/                            # Shared CV Engine
│   │   ├── types.ts                   # Detection, HSVConfig, etc.
│   │   ├── presets.ts                 # HSV anchor + preset constants
│   │   ├── adaptive.ts               # Adaptive HSV thresholds
│   │   ├── segmentation.ts           # Red dual-band masking
│   │   ├── ring-detection.ts         # Hierarchy ring + circle fallback
│   │   ├── annulus.ts                # Annulus scoring
│   │   ├── persistence.ts            # Temporal N-of-M filtering
│   │   └── RedRingDetector.ts        # Unified detector
│   │
│   ├── hooks/                         # Shell React Hooks
│   ├── components/                    # Shell UI Components
│   │   ├── layout/                    # AppShell, SafeArea
│   │   ├── common/                    # LangToggle, StatusBar, CameraSelect
│   │   ├── detection/                 # DetectionView, PinCard, PinList
│   │   ├── settings/                  # SettingsPanel, ModeSelector
│   │   ├── marketplace/               # AppCard, AppGrid, InstallButton
│   │   └── host/                      # MiniAppHost
│   │
│   ├── pages/                         # Shell Pages
│   │   ├── HomePage.tsx               # Installed apps grid
│   │   ├── MarketplacePage.tsx        # Browse/install/remove apps
│   │   └── MiniAppPage.tsx            # Dynamic loader for /app/:appId
│   │
│   ├── mini-apps/                     # First-Party Mini Apps
│   │   ├── traffic-sign/              # Production traffic sign detector
│   │   ├── traffic-sign-tune/         # Debug/tuning variant
│   │   ├── lane-departure/            # Placeholder
│   │   └── combo/                     # Placeholder
│   │
│   ├── sw/                            # Service Worker
│   │   └── sw-custom.ts              # Workbox precache + runtime caching
│   │
│   └── i18n/                          # Internationalization
│       ├── languages.ts               # LANG constant, LangCode type
│       ├── vi.json                    # Vietnamese translations
│       └── en.json                    # English translations
│
├── index.html                         # Vite entry HTML
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/deploy.yml       # GitHub Pages CI/CD
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- HTTPS required for camera access (dev server uses localhost)

### Development

```bash
# Install dependencies
npm install

# Start dev server (localhost with HMR)
npm run dev

# Type check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

### Local HTTPS (for camera testing on non-localhost)

```bash
npx http-server dist -S
```

---

## Creating a New Mini App

### In-repo (first-party)

1. Create a directory under `src/mini-apps/your-app/`
2. Create `manifest.ts` exporting a `MiniAppManifest`
3. Create your app component (React or vanilla JS)
4. Create `index.ts` that exports a `MiniAppLifecycle` (use `createReactMiniApp` for React apps)
5. Register in `src/registry/builtins.ts`
6. Add a loader entry in `src/pages/MiniAppPage.tsx`

### Remote (community)

Community mini apps are hosted externally and installed by URL:

1. Build your mini app as a single ES module bundle
2. Export `mount(container, context)`, `unmount()`, and `manifest` from the default export
3. Host a `manifest.json` and the bundle on any HTTPS server
4. Users install via the Marketplace page by entering the manifest URL

Mini apps receive a `MiniAppContext` with access to all common services (OpenCV, camera, detection loop, i18n, theme, storage, notifications, snapshot). See `src/sdk/types.ts` for the full interface.

---

## Adding a New Language

Adding a language is a single-line change:

1. Add the language code to `LANG` in `src/i18n/languages.ts`:
   ```typescript
   export const LANG = {
     VI: "vi",
     EN: "en",
     JA: "ja",  // add this
   } as const;
   ```

2. Create `src/i18n/ja.json` with translations

3. Register in `src/i18n/index.ts`:
   ```typescript
   import ja from "./ja.json";
   // add to resources: ja: { translation: ja }
   ```

All types (`LangCode`), the `LangToggle` component, language detection, and mini app manifest localization automatically adapt.

---

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | HomePage | Grid of installed mini apps |
| `/marketplace` | MarketplacePage | Browse, install, remove mini apps |
| `/app/:appId` | MiniAppPage | Dynamic loader for any mini app |

---

## Privacy & Safety

- **All processing is on-device.** No video or images are transmitted to any server.
- **Camera requires explicit user action.** No auto-start.
- **Assistive only.** OpenADAS provides warnings — it never controls the vehicle.
- **Fail-safe.** Detection errors are caught gracefully; the system never creates danger.

---

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Safari | 14+ |
| Edge | 90+ |
| Firefox | 88+ |

Targets mid-range smartphones from 2020+ running at 640x480 camera resolution.

---

## Contributing

### No-code contributions
- Test the app on real roads and report results
- Upload sample driving videos
- Report false alerts or missed detections
- Suggest new driving modes

### Code contributions
- Improve detection accuracy in `src/cv/`
- Optimize performance for mobile devices
- Build a new mini app
- Improve UI/UX for driving contexts
- Add translations

---

## Deployment

The project deploys automatically to GitHub Pages via the workflow in `.github/workflows/deploy.yml`. On push to `main`:

1. `npm ci` installs dependencies
2. `npm run build` produces a `dist/` folder with the shell, mini apps, service worker, and static assets
3. The `dist/` folder is deployed to GitHub Pages with the custom domain from `CNAME`

The `public/404.html` SPA fallback ensures client-side routing works on GitHub Pages.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

> **Drive safer. Build together. OpenADAS.**
