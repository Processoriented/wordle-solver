export type DurationUnit = 'ms' | 's' | 'm' | 'h';

export type FormattedDuration = {
  value: number;
  unit: DurationUnit;
};

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

export function formatDuration(ms: number): FormattedDuration {
  const absMs = Math.max(0, ms);

  if (absMs >= MS_PER_HOUR) {
    return { value: roundForDisplay(absMs / MS_PER_HOUR), unit: 'h' };
  }
  if (absMs >= MS_PER_MINUTE) {
    return { value: roundForDisplay(absMs / MS_PER_MINUTE), unit: 'm' };
  }
  if (absMs >= MS_PER_SECOND) {
    return { value: roundForDisplay(absMs / MS_PER_SECOND), unit: 's' };
  }
  return { value: roundForDisplay(absMs), unit: 'ms' };
}

function roundForDisplay(value: number): number {
  if (value >= 100) return Math.round(value);
  if (value >= 10) return Math.round(value * 10) / 10;
  return Math.round(value * 1000) / 1000;
}

export function formatDurationLabel(ms: number): string {
  const { value, unit } = formatDuration(ms);
  return `Estimated processing: ${value.toString()} ${unit}`;
}
