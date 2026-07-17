// Playful multi-color step progress — not a data chart, so the dataviz skill's
// "sequential = one hue" rule doesn't apply here; this is deliberately a rainbow.
// Shared by the assessment's question progress and My Learning's self-paced stepper.
export const PROGRESS_GRADIENT = ["#ef4444", "#14b8a6", "#f97316", "#eab308", "#22c55e"]; // red -> teal -> orange -> yellow -> green

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function progressColorAt(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const segments = PROGRESS_GRADIENT.length - 1;
  const segT = clamped * segments;
  const idx = Math.min(Math.floor(segT), segments - 1);
  const localT = segT - idx;
  const [r1, g1, b1] = hexToRgb(PROGRESS_GRADIENT[idx]);
  const [r2, g2, b2] = hexToRgb(PROGRESS_GRADIENT[idx + 1]);
  return rgbToHex(r1 + (r2 - r1) * localT, g1 + (g2 - g1) * localT, b1 + (b2 - b1) * localT);
}
