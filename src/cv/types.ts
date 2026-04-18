export interface Detection {
  rect: { x: number; y: number; width: number; height: number };
  x: number;
  y: number;
  score: number;
}

export interface UIConfig {
  profile: "auto" | "day" | "night";
  tightness: "loose" | "med" | "tight" | "ultra";
}

export interface ROIConfig {
  topFraction: number;
  heightFraction: number;
}

export interface HSVThreshold {
  h1: [number, number];
  h2: [number, number];
  sMin: number;
  vMin: number;
}

export interface FrameStats {
  l: number;
  s: number;
  v: number;
}

export interface RingThresholds {
  minArea: number;
  outerCircMin: number;
  outerCircMax: number;
  holeCircMin: number;
  ringnessMin: number;
  ringnessMax: number;
  aspectMin: number;
  aspectMax: number;
  minRadius: number;
  thickFrac: number;
  annulusRedMin: number;
  centerRedMax: number;
}
