/**
 * Parses a duration string like "15m", "7d", "30s", "2h" into seconds.
 * Falls back to the given default when the input is invalid.
 */
export function parseDuration(input: string, defaultSeconds = 900): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(input.trim().toLowerCase());
  if (!match) return defaultSeconds;
  const value = Number(match[1]);
  const unit = match[2] ?? "s";
  const factor: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return value * (factor[unit] ?? 1);
}
