const OPENCV_CDN = "https://docs.opencv.org/4.x/opencv.js";
const POLL_INTERVAL_MS = 30;

type ReadyCallback = () => void;

class OpenCVServiceImpl {
  private _ready = false;
  private _loading = false;
  private _error: string | null = null;
  private _listeners: Set<ReadyCallback> = new Set();

  get ready() {
    return this._ready;
  }

  get error() {
    return this._error;
  }

  get cv(): any {
    return (window as any).cv ?? null;
  }

  onReady(cb: ReadyCallback): () => void {
    if (this._ready) {
      cb();
      return () => {};
    }
    this._listeners.add(cb);
    this.load();
    return () => {
      this._listeners.delete(cb);
    };
  }

  load(): Promise<void> {
    if (this._ready) return Promise.resolve();
    if (this._loading) {
      return new Promise<void>((resolve) => {
        this.onReady(resolve);
      });
    }
    this._loading = true;

    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[src="${OPENCV_CDN}"]`,
      );
      if (!existing) {
        const script = document.createElement("script");
        script.src = OPENCV_CDN;
        script.async = true;
        script.onerror = () => {
          this._error = "Failed to load OpenCV.js";
          reject(new Error(this._error));
        };
        document.head.appendChild(script);
      }

      const poll = setInterval(() => {
        const w = window as any;
        if (w.cv && w.cv.Mat) {
          clearInterval(poll);
          this._ready = true;
          this._listeners.forEach((cb) => cb());
          this._listeners.clear();
          resolve();
        }
      }, POLL_INTERVAL_MS);
    });
  }
}

export const OpenCVService = new OpenCVServiceImpl();
