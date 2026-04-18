type StatusListener = (message: string) => void;
type ToastListener = (
  message: string,
  type: "info" | "warning" | "error",
) => void;

class NotificationServiceImpl {
  private _statusListeners: Set<StatusListener> = new Set();
  private _toastListeners: Set<ToastListener> = new Set();
  private _lastStatus = "";

  get lastStatus() {
    return this._lastStatus;
  }

  status(message: string) {
    this._lastStatus = message;
    this._statusListeners.forEach((cb) => cb(message));
  }

  toast(message: string, type: "info" | "warning" | "error" = "info") {
    this._toastListeners.forEach((cb) => cb(message, type));
  }

  onStatus(cb: StatusListener): () => void {
    this._statusListeners.add(cb);
    return () => this._statusListeners.delete(cb);
  }

  onToast(cb: ToastListener): () => void {
    this._toastListeners.add(cb);
    return () => this._toastListeners.delete(cb);
  }
}

export const NotificationService = new NotificationServiceImpl();
