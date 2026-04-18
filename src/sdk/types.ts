import type { LangCode, LANG } from "@/i18n/languages";

export type LocalizedString = Partial<Record<LangCode, string>> & {
  en: string;
};

export type MiniAppPermission =
  | "camera"
  | "opencv"
  | "storage"
  | "notifications";

export interface MiniAppManifest {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  version: string;
  icon: string;
  accentColor: string;
  author: string;
  homepage?: string;
  entryUrl?: string;
  tags?: string[];
  permissions?: MiniAppPermission[];
  minShellVersion?: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MiniAppContext {
  opencv: {
    ready: boolean;
    onReady(cb: () => void): () => void;
    cv: any;
  };
  camera: {
    requestStream(
      constraints?: MediaStreamConstraints,
    ): Promise<MediaStream>;
    listDevices(): Promise<MediaDeviceInfo[]>;
    stopStream(): void;
    currentStream: MediaStream | null;
  };
  detectionLoop: {
    start(
      callback: (timestamp: number) => void,
      frameSkip?: number,
    ): void;
    stop(): void;
    running: boolean;
  };
  matLifecycle: {
    track(mat: any): void;
    disposeAll(): void;
  };
  i18n: {
    LANG: typeof LANG;
    supportedLanguages: LangCode[];
    t(key: string, options?: object): string;
    language: LangCode;
    changeLanguage(lang: LangCode): Promise<void>;
  };
  theme: {
    mode: "light" | "dark";
    forceDark(): void;
    restoreAuto(): void;
  };
  notifications: {
    status(message: string): void;
    toast(
      message: string,
      type?: "info" | "warning" | "error",
    ): void;
  };
  storage: {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
  };
  snapshot: {
    capture(
      video: HTMLVideoElement,
      scale?: number,
    ): HTMLCanvasElement | null;
    crop(canvas: HTMLCanvasElement, rect: Rect): string;
    expandRect(
      rect: Rect,
      frameW: number,
      frameH: number,
      padX?: number,
      padY?: number,
    ): Rect;
  };
}

export interface MiniAppLifecycle {
  manifest: MiniAppManifest;
  mount(
    container: HTMLElement,
    context: MiniAppContext,
  ): void | Promise<void>;
  unmount(): void | Promise<void>;
  onPause?(): void;
  onResume?(): void;
}
