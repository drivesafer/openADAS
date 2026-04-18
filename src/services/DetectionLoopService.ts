export class DetectionLoopService {
  private _running = false;
  private _rafId = 0;
  private _frameCounter = 0;
  private _frameSkip = 0;
  private _callback: ((timestamp: number) => void) | null = null;

  get running() {
    return this._running;
  }

  start(callback: (timestamp: number) => void, frameSkip = 0) {
    if (this._running) return;
    this._running = true;
    this._callback = callback;
    this._frameSkip = frameSkip;
    this._frameCounter = 0;
    this.loop(performance.now());
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    this._callback = null;
  }

  private loop = (timestamp: number) => {
    if (!this._running) return;

    this._frameCounter++;
    if (
      this._frameSkip > 0 &&
      this._frameCounter % (this._frameSkip + 1) !== 0
    ) {
      this._rafId = requestAnimationFrame(this.loop);
      return;
    }

    try {
      this._callback?.(timestamp);
    } catch (e) {
      console.error("[DetectionLoop] Error in frame callback:", e);
    }

    this._rafId = requestAnimationFrame(this.loop);
  };
}
