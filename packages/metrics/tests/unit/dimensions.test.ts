import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NAMESPACE, MAX_DIMENSION_COUNT } from '../../src/constants.js';
import { Metrics, MetricUnit } from '../../src/index.js';

describe('Working with dimensions', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
      POWERTOOLS_METRICS_DISABLED: 'false',
    };
    vi.clearAllMocks();
  });

  it('creates a new dimension set', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });

    // Act
    metrics.addDimension('environment', 'prod');

    metrics.addDimensions({
      dimension1: '1',
      dimension2: '2',
    });

    metrics.addMetric('foo', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        environment: 'prod',
        dimension1: '1',
        dimension2: '2',
        foo: 1,
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [
          ['service', 'environment'],
          ['service', 'dimension1', 'dimension2'],
        ],
      })
    );
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

  it('handles dimension sets with default dimensions and overrides', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
      defaultDimensions: {
        environment: 'prod',
        region: 'us-east-1',
      },
    });

    // Act
    // Add a dimension set that overrides one of the default dimensions
    metrics.addDimensions({
      environment: 'staging', // This should override the default 'prod' value
      feature: 'search',
    });

    metrics.addMetric('api_calls', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        environment: 'staging', // Should use the overridden value
        region: 'us-east-1', // Should keep the default value
        feature: 'search', // Should add the new dimension
        api_calls: 1,
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [
          ['service', 'environment', 'region', 'feature'], // Should include all dimensions
        ],
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

    // Act
    // We start with 2 dimensions because the default dimension & service name are already added
    for (let i = 2; i < MAX_DIMENSION_COUNT; i++) {
      metrics.addDimension(`dimension-${i}`, 'test');
    }

    // Assess
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

    // Assess
    expect(() => metrics.setDefaultDimensions({ extra: 'test' })).toThrowError(
      'The number of metric dimensions must be lower than 29'
    );
  });

  it('throws when adding dimension sets would exceed the limit', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act
    // We start with 2 dimensions because the default dimension & service name are already added
    for (let i = 2; i < MAX_DIMENSION_COUNT; i++) {
      metrics.addDimension(`dimension-${i}`, 'test');
    }

    // Assess
    // Adding a dimension set with 3 dimensions would exceed the limit
    expect(() =>
      metrics.addDimensions({
        'dimension-extra-1': 'test',
        'dimension-extra-2': 'test',
        'dimension-extra-3': 'test',
      })
    ).toThrowError(
      `The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
    );
  });

  it('handles dimension overrides across multiple dimension sets', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });

    // Act
    // First add a single dimension
    metrics.addDimension('d', '3');

    // First dimension set
    metrics.addDimensions({
      a: '1',
      b: '2',
    });

    // Second dimension set with some overlapping keys
    metrics.addDimensions({
      a: '3',
      c: '5',
      d: '8',
    });

    // Third dimension set with more overlapping keys
    metrics.addDimensions({
      b: '5',
      d: '1',
    });

    metrics.addMetric('foo', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        a: '3', // Last value from second set
        b: '5', // Last value from third set
        c: '5', // Only value from second set
        d: '1', // Last value from third set (overriding both the initial d:3 and second set's d:8)
        foo: 1,
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [
          ['service', 'd'],
          ['service', 'a', 'b'],
          ['service', 'a', 'c', 'd'],
          ['service', 'b', 'd'],
        ],
      })
    );
  });

  it.each([
    { value: undefined, name: 'valid-name' },
    { value: null, name: 'valid-name' },
    {
      value: '',
      name: 'valid-name',
    },
    { value: 'valid-value', name: undefined },
    { value: 'valid-value', name: null },
    {
      value: 'valid-value',
      name: '',
    },
  ])('skips invalid dimension values ($name)', ({ value, name }) => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      namespace: DEFAULT_NAMESPACE,
    });

    // Act & Assess
    metrics.addDimension(name as string, value as string);
    metrics.addMetric('test', MetricUnit.Count, 1);

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      `The dimension ${name} doesn't meet the requirements and won't be added. Ensure the dimension name and value are non empty strings`
    );
    expect(console.log).toHaveEmittedEMFWith(
      expect.not.objectContaining({ test: value })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.not.objectContaining({ Dimensions: [['test']] })
    );
  });

  it.each([
    { value: undefined, name: 'valid-name' },
    { value: null, name: 'valid-name' },
    {
      value: '',
      name: 'valid-name',
    },
    {
      value: 'valid-value',
      name: '',
    },
  ])(
    'skips invalid dimension values in addDimensions ($name)',
    ({ value, name }) => {
      // Prepare
      const metrics = new Metrics({
        singleMetric: true,
        namespace: DEFAULT_NAMESPACE,
      });

      // Act & Assess
      metrics.addDimensions({
        validDimension: 'valid',
        [name as string]: value as string,
      });
      metrics.addMetric('test', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();

      expect(console.warn).toHaveBeenCalledWith(
        `The dimension ${name} doesn't meet the requirements and won't be added. Ensure the dimension name and value are non empty strings`
      );
      expect(console.log).toHaveEmittedEMFWith(
        expect.objectContaining({ validDimension: 'valid' })
      );
      expect(console.log).toHaveEmittedEMFWith(
        expect.not.objectContaining({ invalidDimension: value })
      );
    }
  );

  it('warns when addDimensions overwrites existing dimensions', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
      defaultDimensions: { environment: 'prod' },
    });

    // Act
    metrics.addDimension('region', 'us-east-1');
    metrics.addDimensions({
      environment: 'staging', // overwrites default dimension
      region: 'us-west-2', // overwrites regular dimension
      newDim: 'value',
    });
    metrics.addMetric('test', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'Dimension "environment" has already been added. The previous value will be overwritten.'
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Dimension "region" has already been added. The previous value will be overwritten.'
    );
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        environment: 'staging',
        region: 'us-west-2',
        newDim: 'value',
      })
    );
  });

  it('warns when setDefaultDimensions overwrites existing dimensions', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
      defaultDimensions: { environment: 'prod' },
    });

    // Act
    metrics.setDefaultDimensions({ region: 'us-east-1' });
    metrics.setDefaultDimensions({
      environment: 'staging', // overwrites default dimension
    });

    // Assess
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      'Dimension "environment" has already been added. The previous value will be overwritten.'
    );
  });

  it.each([
    { value: undefined, name: 'valid-name' },
    { value: null, name: 'valid-name' },
    { value: '', name: 'valid-name' },
    { value: 'valid-value', name: '' },
  ])(
    'skips invalid default dimension values in setDefaultDimensions ($name)',
    ({ value, name }) => {
      // Arrange
      const metrics = new Metrics({
        singleMetric: true,
        namespace: DEFAULT_NAMESPACE,
      });

      // Act
      metrics.setDefaultDimensions({
        validDimension: 'valid',
        [name as string]: value as string,
      });

      metrics.addMetric('test', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();

      // Assess
      expect(console.warn).toHaveBeenCalledWith(
        `The dimension ${name} doesn't meet the requirements and won't be added. Ensure the dimension name and value are non empty strings`
      );

      expect(console.log).toHaveEmittedEMFWith(
        expect.objectContaining({ validDimension: 'valid' })
      );

      expect(console.log).toHaveEmittedEMFWith(
        expect.not.objectContaining({ [name]: value })
      );
    }
  );
});
