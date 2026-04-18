import type { MiniAppContext } from "./types";
import { OpenCVService } from "@/services/OpenCVService";
import { CameraService } from "@/services/CameraService";
import { DetectionLoopService } from "@/services/DetectionLoopService";
import { MatLifecycleService } from "@/services/MatLifecycleService";
import { I18nService } from "@/services/I18nService";
import { ThemeService } from "@/services/ThemeService";
import { NotificationService } from "@/services/NotificationService";
import { SnapshotService } from "@/services/SnapshotService";
import { createScopedStorage } from "@/services/StorageService";

export function buildMiniAppContext(appId: string): MiniAppContext {
  const loopService = new DetectionLoopService();
  const matService = new MatLifecycleService();
  const storage = createScopedStorage(`app:${appId}`);

  return {
    opencv: {
      get ready() {
        return OpenCVService.ready;
      },
      onReady: (cb) => OpenCVService.onReady(cb),
      get cv() {
        return OpenCVService.cv;
      },
    },
    camera: {
      requestStream: (c) => CameraService.requestStream(c),
      listDevices: () => CameraService.listDevices(),
      stopStream: () => CameraService.stopStream(),
      get currentStream() {
        return CameraService.currentStream;
      },
    },
    detectionLoop: {
      start: (cb, skip) => loopService.start(cb, skip),
      stop: () => loopService.stop(),
      get running() {
        return loopService.running;
      },
    },
    matLifecycle: {
      track: (mat) => matService.track(mat),
      disposeAll: () => matService.disposeAll(),
    },
    i18n: {
      LANG: I18nService.LANG,
      supportedLanguages: I18nService.supportedLanguages,
      t: (key, opts) => I18nService.t(key, opts as Record<string, unknown>),
      get language() {
        return I18nService.language;
      },
      changeLanguage: (lang) => I18nService.changeLanguage(lang),
    },
    theme: {
      get mode() {
        return ThemeService.mode;
      },
      forceDark: () => ThemeService.forceDark(),
      restoreAuto: () => ThemeService.restoreAuto(),
    },
    notifications: {
      status: (msg) => NotificationService.status(msg),
      toast: (msg, type) => NotificationService.toast(msg, type),
    },
    storage,
    snapshot: SnapshotService,
  };
}
