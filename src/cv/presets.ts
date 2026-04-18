import type { RingThresholds } from "./types";

export const ANCHOR = {
  day: { l: 140, s: 75, v: 135 },
  night: { l: 80, s: 95, v: 120 },
} as const;

export const PRESET = {
  day: {
    loose: { s: 90, v: 40, h1: [0, 18] as [number, number], h2: [162, 180] as [number, number] },
    med: { s: 110, v: 55, h1: [0, 16] as [number, number], h2: [164, 180] as [number, number] },
    tight: { s: 130, v: 70, h1: [0, 15] as [number, number], h2: [165, 180] as [number, number] },
    ultra: { s: 150, v: 85, h1: [0, 13] as [number, number], h2: [167, 180] as [number, number] },
  },
  night: {
    loose: { s: 70, v: 25, h1: [0, 20] as [number, number], h2: [160, 180] as [number, number] },
    med: { s: 95, v: 40, h1: [0, 18] as [number, number], h2: [162, 180] as [number, number] },
    tight: { s: 120, v: 55, h1: [0, 16] as [number, number], h2: [164, 180] as [number, number] },
    ultra: { s: 140, v: 70, h1: [0, 14] as [number, number], h2: [166, 180] as [number, number] },
  },
} as const;

export const RING_DEFAULTS: RingThresholds = {
  minArea: 700,
  outerCircMin: 0.55,
  outerCircMax: 1.30,
  holeCircMin: 0.70,
  ringnessMin: 0.18,
  ringnessMax: 0.85,
  aspectMin: 0.65,
  aspectMax: 1.35,
  minRadius: 18,
  thickFrac: 0.14,
  annulusRedMin: 0.58,
  centerRedMax: 0.22,
};
