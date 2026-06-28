import { describe, expect, it } from 'vitest';

import { formatDuration, formatDurationLabel } from './formatDuration';

describe('formatDuration', () => {
  it('formats sub-second values in milliseconds', () => {
    expect(formatDuration(500)).toEqual({ value: 500, unit: 'ms' });
  });

  it('formats seconds with decimals', () => {
    expect(formatDuration(1125)).toEqual({ value: 1.125, unit: 's' });
  });

  it('formats minutes when seconds exceed 60', () => {
    expect(formatDuration(75000)).toEqual({ value: 1.25, unit: 'm' });
  });

  it('formats hours when minutes exceed 60', () => {
    expect(formatDuration(3_600_000)).toEqual({ value: 1, unit: 'h' });
  });

  it('builds a human-readable label', () => {
    expect(formatDurationLabel(1125)).toBe('Estimated processing: 1.125 s');
  });
});
