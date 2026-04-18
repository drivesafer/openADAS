type ThemeMode = "light" | "dark";
type Listener = (mode: ThemeMode) => void;

class ThemeServiceImpl {
  private _forced: ThemeMode | null = null;
  private _listeners: Set<Listener> = new Set();

  get mode(): ThemeMode {
    if (this._forced) return this._forced;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  forceDark() {
    this._forced = "dark";
    this.notify();
  }

  restoreAuto() {
    this._forced = null;
    this.notify();
  }

  subscribe(cb: Listener): () => void {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  private notify() {
    const m = this.mode;
    this._listeners.forEach((cb) => cb(m));
  }
}

export const ThemeService = new ThemeServiceImpl();
