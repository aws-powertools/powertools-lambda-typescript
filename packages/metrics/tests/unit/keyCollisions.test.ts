import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Metrics, MetricUnit } from '../../src/index.js';

describe('EMF key collision detection', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
      POWERTOOLS_METRICS_DISABLED: 'false',
    };
    vi.clearAllMocks();
  });

  it('throws when a metric name conflicts with an existing dimension key', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });
    metrics.addDimension('environment', 'prod');

    // Act & Assess
    expect(() =>
      metrics.addMetric('environment', MetricUnit.Count, 1)
    ).toThrowError(
      'EMF key collision on "environment": registered as both a metric (number) and a dimension (string)'
    );
  });

  it('throws when a metric name conflicts with an existing default dimension key', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: { environment: 'prod' },
    });

    // Act & Assess
    expect(() =>
      metrics.addMetric('environment', MetricUnit.Count, 1)
    ).toThrowError(
      'EMF key collision on "environment": registered as both a metric (number) and a default dimension (string)'
    );
  });

  it('throws when a metric name conflicts with the built-in service dimension', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act & Assess
    expect(() =>
      metrics.addMetric('service', MetricUnit.Count, 1)
    ).toThrowError(
      'EMF key collision on "service": registered as both a metric (number) and a default dimension (string)'
    );
  });

  it('throws when a metric name conflicts with a key added via addDimensions', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });
    metrics.addDimensions({ environment: 'prod' });

    // Act & Assess
    expect(() =>
      metrics.addMetric('environment', MetricUnit.Count, 1)
    ).toThrowError(
      'EMF key collision on "environment": registered as both a metric (number) and a dimension set (string)'
    );
  });

  it('throws on serialize when a dimension key is added after a metric with the same name', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addMetric('environment', MetricUnit.Count, 1);
    metrics.addDimension('environment', 'prod');

    // Act & Assess
    expect(() => metrics.serializeMetrics()).toThrowError(
      'EMF key collision on "environment": registered as both a metric (number) and a dimension (string)'
    );
  });

  it('warns on serialize when a dimension key overwrites a default dimension key', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: 'test',
      defaultDimensions: { environment: 'prod' },
    });
    metrics.addDimension('environment', 'staging');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Act
    metrics.serializeMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'EMF key "environment" is defined as both a default dimension and dimension; the dimension value will take precedence in the serialized output'
    );
  });

  it('warns on serialize when a dimension set key overwrites a regular dimension key', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addDimension('environment', 'prod');
    metrics.addDimensions({ environment: 'staging' });
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Act
    metrics.serializeMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'EMF key "environment" is defined as both a dimension and dimension set; the dimension set value will take precedence in the serialized output'
    );
  });

  it('warns on serialize when a dimension set key overwrites a default dimension key', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: 'test',
      defaultDimensions: { environment: 'prod' },
    });
    metrics.addDimensions({ environment: 'staging' });
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Act
    metrics.serializeMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'EMF key "environment" is defined as both a default dimension and dimension set; the dimension set value will take precedence in the serialized output'
    );
  });
});
