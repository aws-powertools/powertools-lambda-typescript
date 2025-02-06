import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_NAMESPACE,
  EMF_MAX_TIMESTAMP_FUTURE_AGE,
  EMF_MAX_TIMESTAMP_PAST_AGE,
} from '../../src/constants.js';
import { MetricUnit, Metrics } from '../../src/index.js';

describe('Setting custom timestamp', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
      POWERTOOLS_METRICS_DISABLED: 'false',
    };
    vi.clearAllMocks();
    vi.useFakeTimers().setSystemTime(new Date());
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it.each([
    { value: Date.now() - 2000, name: 'epoch' },
    { value: new Date(Date.now()), name: 'Date object' },
  ])('uses the provided timestamp when one is set ($name)', ({ value }) => {
    // Prepare
    const metrics = new Metrics({ singleMetric: true });
    metrics.setTimestamp(value);

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        _aws: expect.objectContaining({
          Timestamp: value instanceof Date ? value.getTime() : value,
        }),
      })
    );
  });

  it('logs a warning when the provided timestamp is too far in the past', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: true });

    // Act
    metrics.setTimestamp(Date.now() - EMF_MAX_TIMESTAMP_PAST_AGE - 1000);

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "This metric doesn't meet the requirements and will be skipped by Amazon CloudWatch. " +
        'Ensure the timestamp is within 14 days in the past or up to 2 hours in the future and is also a valid number or Date object.'
    );
  });

  it('logs a warning when the provided timestamp is too far in the future', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: true });

    // Act
    metrics.setTimestamp(Date.now() + EMF_MAX_TIMESTAMP_FUTURE_AGE + 1000);

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "This metric doesn't meet the requirements and will be skipped by Amazon CloudWatch. " +
        'Ensure the timestamp is within 14 days in the past or up to 2 hours in the future and is also a valid number or Date object.'
    );
  });

  it('logs a warning when the provided timestamp is not a number or Date object', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      namespace: DEFAULT_NAMESPACE,
    });

    // Act
    metrics.setTimestamp(Number.NaN);
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "This metric doesn't meet the requirements and will be skipped by Amazon CloudWatch. " +
        'Ensure the timestamp is within 14 days in the past or up to 2 hours in the future and is also a valid number or Date object.'
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        _aws: expect.objectContaining({
          Timestamp: 0,
        }),
      })
    );
  });

  it('logs a warning when the provided timestamp is not an integer', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      namespace: DEFAULT_NAMESPACE,
    });

    // Act
    metrics.setTimestamp(Date.now() + 0.5);
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "This metric doesn't meet the requirements and will be skipped by Amazon CloudWatch. " +
        'Ensure the timestamp is within 14 days in the past or up to 2 hours in the future and is also a valid number or Date object.'
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        _aws: expect.objectContaining({
          Timestamp: 0,
        }),
      })
    );
  });
});
