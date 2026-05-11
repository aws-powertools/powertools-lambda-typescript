import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Metrics, MetricUnit } from '../../src/index.js';

describe('Working with metadata', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
      POWERTOOLS_METRICS_DISABLED: 'false',
    };
    vi.clearAllMocks();
  });

  it('adds metadata to the metric', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics
      .addMetadata('cost-center', '1234')
      .addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'hello-world', 'cost-center': '1234' })
    );
  });

  it('overwrites metadata with the same key', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics
      .addMetadata('cost-center', '1234')
      .addMetadata('cost-center', '5678')
      .addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'hello-world', 'cost-center': '5678' })
    );
  });

  it('clears the metadata', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics.addMetadata('cost-center', '1234').clearMetadata();

    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.not.objectContaining({ 'cost-center': '1234' })
    );
  });

  it('clears the metadata after adding a metric', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics.addMetadata('cost-center', '1234');
    metrics.addMetric('test', MetricUnit.Count, 1);
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({ 'cost-center': '1234' })
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      2,
      expect.not.objectContaining({ 'cost-center': '1234' })
    );
  });

  it('throws when a metadata key conflicts with an existing metric name', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addMetric('request_count', MetricUnit.Count, 42);

    // Act & Assess
    expect(() =>
      metrics.addMetadata('request_count', 'not-a-number')
    ).toThrowError(
      'Metadata key "request_count" conflicts with an existing metric name'
    );
  });
});
