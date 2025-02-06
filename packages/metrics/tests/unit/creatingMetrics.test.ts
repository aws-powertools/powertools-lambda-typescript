import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_NAMESPACE,
  MAX_METRICS_SIZE,
  MetricResolution,
} from '../../src/constants.js';
import { MetricUnit, Metrics } from '../../src/index.js';

describe('Creating metrics', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
      POWERTOOLS_METRICS_DISABLED: 'false',
    };
    vi.clearAllMocks();
  });

  it('creates a compliant CloudWatch EMF metric', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      serviceName: 'hello-world',
      defaultDimensions: { environment: 'test' },
      namespace: DEFAULT_NAMESPACE,
    });
    const timestamp = Date.now() + 1000;

    // Act
    metrics.setTimestamp(timestamp);
    metrics.addMetadata('cost-center', '1234');
    metrics.addDimension('commit', '1234');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith({
      _aws: {
        Timestamp: timestamp,
        CloudWatchMetrics: [
          {
            Namespace: DEFAULT_NAMESPACE,
            Dimensions: [['service', 'environment', 'commit']],
            Metrics: [{ Name: 'test', Unit: 'Count' }],
          },
        ],
      },
      service: 'hello-world',
      environment: 'test',
      'cost-center': '1234',
      commit: '1234',
      test: 1,
    });
  });

  it('stores metrics until flushed', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: false });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);
    metrics.addMetric('test', MetricUnit.Count, 2);
    metrics.addMetric('another', MetricUnit.Bytes, 3);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        test: [1, 2],
        another: 3,
        service: 'hello-world',
      })
    );
    expect(console.log).toHaveEmittedNthMetricWith(
      1,
      expect.objectContaining({
        Metrics: [
          {
            Name: 'test',
            Unit: 'Count',
          },
          {
            Name: 'another',
            Unit: 'Bytes',
          },
        ],
      })
    );
  });

  it('clears stored metrics when calling clearMetrics', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: false });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);
    metrics.addMetric('test', MetricUnit.Count, 2);
    metrics.clearMetrics();
    metrics.addMetric('another', MetricUnit.Count, 3);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        another: 3,
        service: 'hello-world',
      })
    );
    expect(console.log).not.toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        test: [1, 2],
      })
    );
  });

  it('clears stored metrics after publishing', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: false });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);
    metrics.addMetric('test', MetricUnit.Count, 2);
    metrics.publishStoredMetrics();
    metrics.addMetric('another', MetricUnit.Count, 3);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).not.toHaveEmittedNthEMFWith(
      2,
      expect.objectContaining({
        test: [1, 2],
        service: 'hello-world',
      })
    );
  });

  it('throws when adding the same metric name with different units', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: false });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);
    expect(() => metrics.addMetric('test', MetricUnit.Seconds, 2)).toThrowError(
      'Metric "test" has already been added with unit "Count", but we received unit "Seconds". Did you mean to use metric unit "Count"?'
    );
  });

  it('includes the storage resolution when provided', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: true });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1, MetricResolution.High);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthMetricWith(
      1,
      expect.objectContaining({
        Metrics: [
          {
            Name: 'test',
            Unit: 'Count',
            StorageResolution: 1,
          },
        ],
      })
    );
  });

  it('logs a warning when flushing metrics on an empty buffer', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });

    // Act
    metrics.publishStoredMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      'No application metrics to publish. The cold-start metric may be published if enabled. If application metrics should never be empty, consider using `throwOnEmptyMetrics`'
    );
  });

  it('throws when flushing metrics on an empty buffer with throwOnEmptyMetrics enabled', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });

    // Act & Assess
    metrics.setThrowOnEmptyMetrics(true);
    expect(() => metrics.publishStoredMetrics()).toThrowError(
      'The number of metrics recorded must be higher than zero'
    );
  });

  it('flushes the buffer automatically when the buffer is full', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
    });

    // Act
    for (let i = 0; i < MAX_METRICS_SIZE; i++) {
      metrics.addMetric(`test-${i}`, MetricUnit.Count, i);
    }
    metrics.addMetric('another', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        service: 'hello-world',
        'test-0': 0,
        'test-99': 99,
      })
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      2,
      expect.objectContaining({
        another: 1,
        service: 'hello-world',
      })
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      2,
      expect.not.objectContaining({
        'test-1': 1,
      })
    );
  });

  it('flushes the buffer automatically when the max values per metric is reached', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
    });

    // Act
    for (let i = 0; i < MAX_METRICS_SIZE; i++) {
      metrics.addMetric('test', MetricUnit.Count, i);
    }
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        service: 'hello-world',
        test: Array.from({ length: MAX_METRICS_SIZE }, (_, i) => i),
      })
    );
  });
});
