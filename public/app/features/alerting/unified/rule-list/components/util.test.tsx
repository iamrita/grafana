import { calculateNextEvaluationEstimate, formatFiringDuration } from './util';

describe('calculateNextEvaluationEstimate', () => {
  const MOCK_NOW = new Date('2024-05-23T12:00:00');

  beforeEach(() => {
    jest.useFakeTimers({ now: MOCK_NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('with timestamp of last evaluation', () => {
    // a minute ago
    const lastEvaluation = new Date(MOCK_NOW.valueOf() - 60 * 1000).toISOString();
    const interval = '5m';

    const output = calculateNextEvaluationEstimate(lastEvaluation, interval);
    expect(output).toStrictEqual({
      humanized: 'in 4 minutes',
      fullDate: '2024-05-23 12:04:00',
    });
  });

  test('returns undefined when the last evaluation or interval is missing', () => {
    expect(calculateNextEvaluationEstimate(undefined, '1m')).toBeUndefined();
    expect(calculateNextEvaluationEstimate(MOCK_NOW.toISOString(), undefined)).toBeUndefined();
    expect(calculateNextEvaluationEstimate('not-a-date', '1m')).toBeUndefined();
  });

  test('with last evaluation having missed ticks', () => {
    // 6 minutes ago, so we missed a tick
    const lastEvaluation = new Date(MOCK_NOW.valueOf() - 6 * 60 * 1000).toISOString();
    const interval = '5m';

    const output = calculateNextEvaluationEstimate(lastEvaluation, interval);
    expect(output).toStrictEqual({
      humanized: 'within 5m',
      fullDate: 'within 5m',
    });
  });
});

describe('formatFiringDuration', () => {
  const now = new Date('2024-05-23T12:00:00');

  test('formats the elapsed time since the alert became active', () => {
    const activeAt = new Date(now.valueOf() - (2 * 60 + 34) * 1000).toISOString();
    expect(formatFiringDuration(activeAt, now)).toBe('2m34s');
  });

  test('returns undefined for a missing or invalid timestamp', () => {
    expect(formatFiringDuration(undefined, now)).toBeUndefined();
    expect(formatFiringDuration('not-a-date', now)).toBeUndefined();
  });
});
