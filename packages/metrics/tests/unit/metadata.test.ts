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

  it('throws on serialize when metadata key and metric name collide (metric first)', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addMetric('request_count', MetricUnit.Count, 42);
    metrics.addMetadata('request_count', 'not-a-number');

    // Act & Assess
    expect(() => metrics.serializeMetrics()).toThrowError(
      'EMF key collision on "request_count": registered as both a metric (number) and a metadata (string)'
    );
  });

  it('throws on serialize when metadata key and metric name collide (metadata first)', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addMetadata('request_count', 'not-a-number');
    metrics.addMetric('request_count', MetricUnit.Count, 42);

    // Act & Assess
    expect(() => metrics.serializeMetrics()).toThrowError(
      'EMF key collision on "request_count": registered as both a metric (number) and a metadata (string)'
    );
  });

  it('warns on serialize when a metadata key matches a dimension key, and the dimension wins', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addDimension('environment', 'prod');
    metrics.addMetadata('environment', 'metadata-value');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Act
    const serialized = metrics.serializeMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'EMF key "environment" is defined as both a metadata and dimension; the dimension value will take precedence in the serialized output'
    );
    expect(serialized).toMatchObject({ environment: 'prod' });
  });

  it('warns on serialize when a metadata key matches a default dimension key, and the default dimension wins', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: 'test',
      defaultDimensions: { environment: 'prod' },
    });
    metrics.addMetadata('environment', 'metadata-value');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Act
    const serialized = metrics.serializeMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'EMF key "environment" is defined as both a metadata and default dimension; the default dimension value will take precedence in the serialized output'
    );
    expect(serialized).toMatchObject({ environment: 'prod' });
  });

  it('warns on serialize when a metadata key matches a dimension set key, and the dimension set wins', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addDimensions({ environment: 'prod' });
    metrics.addMetadata('environment', 'metadata-value');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Act
    const serialized = metrics.serializeMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'EMF key "environment" is defined as both a metadata and dimension set; the dimension set value will take precedence in the serialized output'
    );
    expect(serialized).toMatchObject({ environment: 'prod' });
  });

  it('still lets the dimension win and warns even when addMetadata is called before addDimension', () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    metrics.addMetadata('environment', 'metadata-value');
    metrics.addDimension('environment', 'prod');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Act
    const serialized = metrics.serializeMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'EMF key "environment" is defined as both a metadata and dimension; the dimension value will take precedence in the serialized output'
    );
    expect(serialized).toMatchObject({ environment: 'prod' });
  });
});
