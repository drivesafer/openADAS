import { useEffect, useRef, useState } from "react";
import type { MiniAppContext } from "@/sdk/types";
import { createRedRingDetector } from "@/cv/RedRingDetector";
import { StatusBar } from "@/components/common/StatusBar";

export function TrafficSignTuneApp({ context }: { context: MiniAppContext }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const outCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [profile, setProfile] = useState("auto");
  const [tightness, setTightness] = useState("med");
  const detectorRef = useRef<ReturnType<typeof createRedRingDetector> | null>(null);

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
      try {
        await context.camera.requestStream({
          video: { width: 640, height: 480, facingMode: "environment" },
          audio: false,
        });
      } catch (e: any) {
        context.notifications.status("Camera Error: " + e.message);
        return;
      }
      if (cancelled) return;

      const video = videoRef.current!;
      video.srcObject = context.camera.currentStream;
      await video.play();

      const detector = createRedRingDetector({
        video,
        outputCanvas: outCanvasRef.current!,
        maskCanvas: maskCanvasRef.current!,
        frameSkip: 0,
        statsEveryN: 1,
        drawLabels: true,
        getUIConfig: () => ({
          profile: profile as any,
          tightness: tightness as any,
        }),
      });
      detector.start();
      detectorRef.current = detector;
      context.notifications.status(context.i18n.t("running"));
    })();

    return () => {
      cancelled = true;
      detectorRef.current?.stop();
      context.camera.stopStream();
      context.theme.restoreAuto();
    };
  }, [context, profile, tightness]);

  return (
    <div className="min-h-screen bg-[#121212] p-3.5 text-center text-white">
      <h2 className="my-2 text-lg font-bold">Real-Time Red Ring Sign Detector</h2>
      <StatusBar />

      <div className="mx-auto my-2 flex flex-wrap justify-center gap-2.5">
        <select
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          className="rounded-lg border border-[#444] bg-[#1b1b1b] px-2.5 py-2 text-white"
        >
          <option value="auto">Profile: Auto (Day/Night)</option>
          <option value="day">Profile: Day</option>
          <option value="night">Profile: Night</option>
        </select>
        <select
          value={tightness}
          onChange={(e) => setTightness(e.target.value)}
          className="rounded-lg border border-[#444] bg-[#1b1b1b] px-2.5 py-2 text-white"
        >
          <option value="loose">HSV: Loose</option>
          <option value="med">HSV: Medium</option>
          <option value="tight">HSV: Tight</option>
          <option value="ultra">HSV: Ultra</option>
        </select>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-center gap-3.5">
        <div className="min-w-[320px] max-w-[640px] flex-1">
          <div className="my-1.5 text-[13px] font-bold uppercase tracking-wider text-[#00ff00]">
            Live Detection
          </div>
          <canvas ref={outCanvasRef} className="w-full rounded-[10px] border-2 border-[#333] bg-black" />
        </div>
        <div className="min-w-[320px] max-w-[640px] flex-1">
          <div className="my-1.5 text-[13px] font-bold uppercase tracking-wider text-[#00ff00]">
            Debug Mask (Red)
          </div>
          <canvas ref={maskCanvasRef} className="w-full rounded-[10px] border-2 border-[#333] bg-black" />
        </div>
      </div>

      <video ref={videoRef} width={640} height={480} autoPlay playsInline muted className="hidden" />
    </div>
  );
}
