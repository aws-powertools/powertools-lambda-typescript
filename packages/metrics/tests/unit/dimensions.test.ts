import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NAMESPACE, MAX_DIMENSION_COUNT } from '../../src/constants.js';
import { MetricUnit, Metrics } from '../../src/index.js';

describe('Working with dimensions', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES, POWERTOOLS_DEV: 'true' };
    vi.resetAllMocks();
  });

  it('adds default dimensions to the metric via constructor', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'hello-world', environment: 'test' })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'environment']],
      })
    );
  });

  it('adds default dimensions to the metric via method', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'prod',
      },
    });

    // Act
    metrics.setDefaultDimensions({ environment: 'test', commit: '1234' });
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        environment: 'test',
        commit: '1234',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'environment', 'commit']],
      })
    );
  });

  it('adds one dimension to the metric', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics.addDimension('environment', 'test');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'hello-world', environment: 'test' })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'environment']],
      })
    );
  });

  it('adds multiple dimensions to the metric', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics.addDimensions({ environment: 'test', commit: '1234' });
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        environment: 'test',
        commit: '1234',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'environment', 'commit']],
      })
    );
  });

  it('overrides an existing dimension with the same name', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act
    metrics.addDimension('environment', 'prod');
    metrics.addDimension('commit', '1234');
    metrics.addDimension('commit', '5678');
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        environment: 'prod',
        commit: '5678',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'environment', 'commit']],
      })
    );
  });

  it('clears default dimensions', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act
    metrics.addDimension('commit', '1234');
    metrics.clearDefaultDimensions();
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.not.objectContaining({
        environment: 'test',
        service: 'hello-world',
      })
    );
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        commit: '1234',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['commit']],
      })
    );
  });

  it('clears all non-default dimensions', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act
    metrics.addDimension('commit', '1234');
    metrics.clearDimensions();
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.not.objectContaining({
        commit: '1234',
      })
    );
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        environment: 'test',
        service: 'hello-world',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'environment']],
      })
    );
  });

  it('clears standard dimensions after publishing the metric', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act
    metrics.addDimension('commit', '1234');
    metrics.addMetric('test', MetricUnit.Count, 1);
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({ commit: '1234', environment: 'test' })
    );
    expect(console.log).toHaveEmittedNthMetricWith(
      1,
      expect.objectContaining({
        Dimensions: [['service', 'environment', 'commit']],
      })
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      2,
      expect.not.objectContaining({ commit: '1234' })
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      2,
      expect.objectContaining({ environment: 'test' })
    );
    expect(console.log).toHaveEmittedNthMetricWith(
      2,
      expect.objectContaining({
        Dimensions: [['service', 'environment']],
      })
    );
  });

  it('throws when the number of dimensions exceeds the limit', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act & Assess
    let i = 1;
    // We start with 2 dimensions because the default dimension & service name are already added
    for (i = 2; i < MAX_DIMENSION_COUNT; i++) {
      metrics.addDimension(`dimension-${i}`, 'test');
    }
    expect(() => metrics.addDimension('extra', 'test')).toThrowError(
      `The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
    );
  });

  it('throws when the number of dimensions exceeds the limit after adding default dimensions', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    // We start with 1 dimension because service name is already added
    for (let i = 1; i < MAX_DIMENSION_COUNT - 1; i++) {
      metrics.setDefaultDimensions({ [`dimension-${i}`]: 'test' });
    }
    expect(() => metrics.setDefaultDimensions({ extra: 'test' })).toThrowError(
      'Max dimension count hit'
    );
  });

  it.each([
    { value: undefined, name: 'undefined' },
    { value: null, name: 'null' },
    {
      value: '',
      name: 'empty string',
    },
  ])('skips invalid dimension values ($name)', ({ value }) => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      namespace: DEFAULT_NAMESPACE,
    });

    // Act & Assess
    metrics.addDimension('test', value as string);
    metrics.addMetric('test', MetricUnit.Count, 1);

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      `The dimension test doesn't meet the requirements and won't be added. Ensure the dimension name and value are non empty strings`
    );
    expect(console.log).toHaveEmittedEMFWith(
      expect.not.objectContaining({ test: value })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.not.objectContaining({ Dimensions: [['test']] })
    );
  });
});
