import { useState, useCallback, useEffect } from "react";
import { CameraService } from "@/services/CameraService";

export function useCamera() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const listDevices = useCallback(async () => {
    const devs = await CameraService.listDevices();
    setDevices(devs);
    return devs;
  }, []);

  const start = useCallback(async (video: HTMLVideoElement, deviceId?: string) => {
    const s = await CameraService.bindToVideo(video, deviceId);
    setStream(s);
    await listDevices();
    return s;
  }, [listDevices]);

  const stop = useCallback(() => {
    CameraService.stopStream();
    setStream(null);
  }, []);

  useEffect(() => {
    return () => CameraService.stopStream();
  }, []);

  return { devices, stream, start, stop, listDevices };
}
