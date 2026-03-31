/** Parse compact durations: `400ms`, `30s`, `15m`, `2h`, `7d`. */
export function durationToMs(input: string): number {
  const s = input.trim();
  const m = /^(\d+)(ms|s|m|h|d)$/i.exec(s);
  if (!m) {
    throw new Error(`Invalid duration "${input}" (use e.g. 15m, 7d)`);
  }
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const mult: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * mult[u]!;
}
