import type { Detection } from "./types";

export class TemporalFilter {
  private history: Detection[][] = [];
  private maxHistory: number;
  private minOccurrence: number;
  private distThreshold: number;

  constructor(maxHistory = 6, minOccurrence = 3, distThreshold = 40) {
    this.maxHistory = maxHistory;
    this.minOccurrence = minOccurrence;
    this.distThreshold = distThreshold;
  }

  filter(candidates: Detection[]): Detection[] {
    this.history.push(candidates);
    if (this.history.length > this.maxHistory) this.history.shift();

    const stable: Detection[] = [];
    for (const c of candidates) {
      let seen = 0;
      for (const frame of this.history) {
        if (frame.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < this.distThreshold)) {
          seen++;
        }
      }
      if (seen >= this.minOccurrence) stable.push(c);
    }
    return stable;
  }

  reset() {
    this.history = [];
  }
}
