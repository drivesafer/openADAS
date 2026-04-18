export class MatLifecycleService {
  private _tracked: Set<any> = new Set();

  track(mat: any) {
    if (mat) this._tracked.add(mat);
  }

  disposeAll() {
    this._tracked.forEach((m) => {
      try {
        if (m && !m.isDeleted?.()) m.delete();
      } catch {
        // already deleted or invalid
      }
    });
    this._tracked.clear();
  }

  disposeMat(mat: any) {
    try {
      if (mat && !mat.isDeleted?.()) mat.delete();
    } catch {
      // ignore
    }
    this._tracked.delete(mat);
  }
}
