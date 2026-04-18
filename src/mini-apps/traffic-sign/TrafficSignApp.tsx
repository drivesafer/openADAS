import { useEffect, useRef, useState, useCallback } from "react";
import type { MiniAppContext, Rect } from "@/sdk/types";
import type { Detection } from "@/cv/types";
import { createRedRingDetector } from "@/cv/RedRingDetector";
import { DetectionView } from "@/components/detection/DetectionView";
import { PinList, type PinData } from "@/components/detection/PinList";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { ModeSelector } from "@/components/settings/ModeSelector";
import { CameraSelect } from "@/components/common/CameraSelect";
import { StatusBar } from "@/components/common/StatusBar";
import { unionRects } from "@/utils/geometry";

const TRACK_MIN_MS = 220;
const MISS_FRAMES_TO_END = 8;
const PIN_COOLDOWN_MS = 1200;
const CLUSTER_WINDOW_MS = 700;
const MAX_PINS = 5;

interface TrackState {
  startTs: number;
  clusterUntil: number;
  lastSeenTs: number;
  missCount: number;
  frames: { ts: number; canvas: HTMLCanvasElement; w: number; h: number; rect: Rect }[];
  clusterRect: Rect;
}

export function TrafficSignApp({ context }: { context: MiniAppContext }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("day");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [pins, setPins] = useState<PinData[]>([]);
  const detectorRef = useRef<ReturnType<typeof createRedRingDetector> | null>(null);
  const trackRef = useRef<TrackState | null>(null);
  const lastPinTsRef = useRef(0);

  useEffect(() => {
    context.theme.forceDark();
    let cancelled = false;

    (async () => {
      context.notifications.status(context.i18n.t("loading_opencv"));
      await new Promise<void>((resolve) => {
        const unsub = context.opencv.onReady(() => { unsub(); resolve(); });
      });
      if (cancelled) return;

      context.notifications.status(context.i18n.t("requesting_camera"));
      const video = videoRef.current!;
      await context.camera.requestStream({
        video: { width: 640, height: 480, facingMode: "environment" },
        audio: false,
      });
      video.srcObject = context.camera.currentStream;
      await video.play();

      const devs = await context.camera.listDevices();
      setDevices(devs);
      if (devs[0]) setSelectedCamera(devs[0].deviceId);

      context.notifications.status(context.i18n.t("ready"));
    })();

    return () => {
      cancelled = true;
      context.camera.stopStream();
      context.theme.restoreAuto();
      detectorRef.current?.stop();
    };
  }, [context]);

  const startDetector = useCallback(() => {
    detectorRef.current?.stop();
    const video = videoRef.current!;
    const canvas = canvasRef.current!;

    const detector = createRedRingDetector({
      video,
      outputCanvas: canvas,
      roi: { topFraction: 0.0, heightFraction: 0.7 },
      getUIConfig: () => ({
        profile: mode as "day" | "night",
        tightness: mode === "day" ? "med" : "ultra",
      }),
    });

    detector.onStable = (stable: Detection[]) => {
      const t = performance.now();
      const track = trackRef.current;

      if (stable.length) {
        const rectNow = stable.length >= 2
          ? unionRects(stable.map((s) => s.rect))
          : stable[0]!.rect;

        if (!track) {
          trackRef.current = {
            startTs: t,
            clusterUntil: t + CLUSTER_WINDOW_MS,
            lastSeenTs: t,
            missCount: 0,
            frames: [],
            clusterRect: rectNow,
          };
        } else {
          track.lastSeenTs = t;
          track.missCount = 0;
          track.clusterRect = unionRects([track.clusterRect, rectNow]);
        }

        const tr = trackRef.current!;
        if (!tr.frames.length || t - tr.frames[tr.frames.length - 1]!.ts > 55) {
          const snap = context.snapshot.capture(video);
          if (snap) {
            tr.frames.push({ ts: t, canvas: snap, w: snap.width, h: snap.height, rect: tr.clusterRect });
            if (tr.frames.length > 8) tr.frames.shift();
          }
        }
      } else if (track) {
        track.missCount++;
        if (track.missCount >= MISS_FRAMES_TO_END) {
          const duration = t - track.startTs;
          const canPin = t - lastPinTsRef.current > PIN_COOLDOWN_MS;

          if (duration >= TRACK_MIN_MS && canPin && track.frames.length >= 4) {
            const idx = Math.min(track.frames.length - 2, Math.floor(track.frames.length * 0.7));
            const pick = track.frames[idx]!;
            const cropBase = pick.rect || track.clusterRect;
            const crop = context.snapshot.expandRect(cropBase, pick.w, pick.h);
            const url = context.snapshot.crop(pick.canvas, crop);

            setPins((prev) => {
              const next = [{ id: `${Date.now()}`, imageUrl: url, pinnedAt: t }, ...prev];
              return next.slice(0, MAX_PINS);
            });
            lastPinTsRef.current = t;
          }
          trackRef.current = null;
        }
      }
    };

    detector.start();
    detectorRef.current = detector;
  }, [context, mode]);

  const togglePanel = () => {
    const willHide = panelVisible;
    setPanelVisible(!panelVisible);

    if (willHide) {
      setRunning(true);
      trackRef.current = null;
      startDetector();
      context.notifications.status(context.i18n.t("running"));
    } else {
      setRunning(false);
      detectorRef.current?.stop();
      detectorRef.current = null;
      context.notifications.status(context.i18n.t("paused"));
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    const wasRunning = running;
    detectorRef.current?.stop();
    setRunning(false);
    setSelectedCamera(deviceId);

    context.notifications.status(context.i18n.t("switching_camera"));
    const video = videoRef.current!;
    context.camera.stopStream();
    await context.camera.requestStream({
      video: { width: 640, height: 480, deviceId: { exact: deviceId } },
      audio: false,
    });
    video.srcObject = context.camera.currentStream;
    await video.play();

    if (wasRunning) {
      setRunning(true);
      startDetector();
      context.notifications.status(context.i18n.t("running"));
    } else {
      context.notifications.status(context.i18n.t("paused"));
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-driving-bg text-white">
      <DetectionView
        showVideo={!running}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />

      <PinList pins={pins} />

      <button
        onClick={togglePanel}
        className="absolute right-2.5 top-2.5 z-10 rounded-[14px] border border-white/14 bg-[#0f0f0f]/86 px-3 py-2.5 font-bold tracking-wide backdrop-blur-md"
      >
        {panelVisible ? "HIDE" : "MENU"}
      </button>

      <SettingsPanel visible={panelVisible}>
        <div className="text-sm font-extrabold uppercase tracking-wider text-green">
          {context.i18n.t("settings")}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-gray-400">{context.i18n.t("camera")}</div>
          <CameraSelect
            devices={devices}
            value={selectedCamera}
            onChange={handleCameraChange}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-gray-400">{context.i18n.t("mode")}</div>
          <ModeSelector value={mode} onChange={setMode} />
        </div>
        <div className="text-xs leading-snug text-gray-400">
          {context.i18n.t("hide_menu_hint")}
        </div>
        <div className="mt-auto">
          <StatusBar />
        </div>
      </SettingsPanel>
    </div>
  );
}
