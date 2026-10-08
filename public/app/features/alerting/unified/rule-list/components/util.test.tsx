import { calculateFiringDuration, calculateNextEvaluationEstimate } from './util';

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

  test('returns undefined when last evaluation or interval is missing', () => {
    expect(calculateNextEvaluationEstimate(undefined, '5m')).toBeUndefined();
    expect(calculateNextEvaluationEstimate(new Date().toISOString(), undefined)).toBeUndefined();
  });

  test('returns undefined for invalid dates, nil dates, and invalid intervals', () => {
    expect(calculateNextEvaluationEstimate('not-a-date', '5m')).toBeUndefined();
    expect(calculateNextEvaluationEstimate('0001-01-01T00:00:00Z', '5m')).toBeUndefined();
    expect(calculateNextEvaluationEstimate(MOCK_NOW.toISOString(), 'not-an-interval')).toBeUndefined();
  });
});

describe('calculateFiringDuration', () => {
  const MOCK_NOW = new Date('2024-05-23T12:00:00');

  beforeEach(() => {
    jest.useFakeTimers({ now: MOCK_NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('formats the elapsed time since last evaluation', () => {
    const lastEvaluation = new Date(MOCK_NOW.valueOf() - (2 * 60 + 34) * 1000).toISOString();
    expect(calculateFiringDuration(lastEvaluation)).toBe('2m34s');
  });

  test('returns undefined for missing, invalid, nil, or future dates', () => {
    expect(calculateFiringDuration()).toBeUndefined();
    expect(calculateFiringDuration('not-a-date')).toBeUndefined();
    expect(calculateFiringDuration('0001-01-01T00:00:00Z')).toBeUndefined();
    expect(calculateFiringDuration(new Date(MOCK_NOW.valueOf() + 60_000).toISOString())).toBeUndefined();
  });
});
