import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NAMESPACE, MAX_DIMENSION_COUNT } from '../../src/constants.js';
import { MetricUnit, Metrics } from '../../src/index.js';

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
      expect.objectContaining({ service: 'hello-world', environment: 'test' })
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

  it('adds empty dimension set when no dimensions are provided', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics.addDimensions({});
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
      })
    );
    // With empty dimensions, we should only have the default dimension set
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service']],
      })
    );
  });

  it('supports addDimensionSet as an alias for addDimensions', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
    });

    // Act
    metrics.addDimension('environment', 'test');
    metrics.addDimensionSet({ region: 'us-west-2' });
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        environment: 'test',
        region: 'us-west-2',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'environment', 'region']],
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
    metrics.setDefaultDimensions({});
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'hello-world' })
    );
    expect(console.log).toHaveEmittedEMFWith(
      expect.not.objectContaining({ environment: 'test' })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service']],
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
      expect.objectContaining({ service: 'hello-world', environment: 'test' })
    );
    expect(console.log).toHaveEmittedEMFWith(
      expect.not.objectContaining({ commit: '1234' })
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

  it('clears dimension sets after publishing the metric', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act
    metrics.addDimensions({ region: 'us-west-2' });
    metrics.addMetric('test', MetricUnit.Count, 1);
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({ region: 'us-west-2', environment: 'test' })
    );
    // With the new implementation, we expect two dimension sets in the first metric
    expect(console.log).toHaveEmittedNthMetricWith(
      1,
      expect.objectContaining({
        Dimensions: expect.arrayContaining([
          expect.arrayContaining(['service', 'environment', 'region']),
        ]),
      })
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      2,
      expect.not.objectContaining({ region: 'us-west-2' })
    );
    expect(console.log).toHaveEmittedNthEMFWith(
      2,
      expect.objectContaining({ environment: 'test' })
    );
    // And only one dimension set in the second metric
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
    });

    // Act & Assess
    const dimensions: Record<string, string> = {};
    for (let i = 0; i < MAX_DIMENSION_COUNT; i++) {
      dimensions[`dimension${i}`] = `value${i}`;
    }

    expect(() => {
      metrics.addDimensions(dimensions);
    }).toThrow(RangeError);
  });

  it('throws when the number of dimensions exceeds the limit after adding default dimensions', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      defaultDimensions: {
        environment: 'test',
      },
    });

    // Act & Assess
    const dimensions: Record<string, string> = {};
    for (let i = 0; i < MAX_DIMENSION_COUNT - 1; i++) {
      dimensions[`dimension${i}`] = `value${i}`;
    }

    expect(() => {
      metrics.addDimensions(dimensions);
    }).toThrow(RangeError);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty string', ''],
  ])('skips invalid dimension values (%s)', (_, value) => {
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

it('adds empty dimension set when no dimensions are provided', () => {
  // Prepare
  const metrics = new Metrics({
    singleMetric: true,
  });

  // Act
  metrics.addDimensions({});
  metrics.addMetric('test', MetricUnit.Count, 1);

  // Assess
  expect(console.log).toHaveEmittedEMFWith(
    expect.objectContaining({
      service: 'hello-world',
    })
  );
  // With empty dimensions, we should only have the default dimension set
  expect(console.log).toHaveEmittedMetricWith(
    expect.objectContaining({
      Dimensions: [['service']],
    })
  );
});

it('adds multiple dimension sets to the metric', () => {
  // Prepare
  const metrics = new Metrics({
    singleMetric: true,
  });

  // Act - First add a dimension, then add a dimension set
  metrics.addDimension('environment', 'test');
  metrics.addDimensions({ dimension1: '1', dimension2: '2' });

  // Verify the dimension sets are stored correctly
  expect((metrics as unknown).dimensionSets).toHaveLength(1);
  expect((metrics as unknown).dimensionSets[0]).toEqual([
    'service',
    'dimension1',
    'dimension2',
  ]);

  // Emit the metric
  metrics.addMetric('test', MetricUnit.Count, 1);

  // Assess the EMF output
  expect(console.log).toHaveEmittedEMFWith(
    expect.objectContaining({
      service: 'hello-world',
      environment: 'test',
      dimension1: '1',
      dimension2: '2',
    })
  );

  // With the new implementation, we expect two dimension sets in the output
  expect(console.log).toHaveEmittedMetricWith(
    expect.objectContaining({
      Dimensions: expect.arrayContaining([
        expect.arrayContaining(['service', 'environment']),
        expect.arrayContaining(['service', 'dimension1', 'dimension2']),
      ]),
    })
  );
});

it('skips adding dimension set when all values are invalid', () => {
  // Prepare
  const metrics = new Metrics({
    singleMetric: true,
  });

  // Act
  metrics.addDimensions({
    dimension1: '',
    dimension2: null as unknown as string,
  });
  metrics.addMetric('test', MetricUnit.Count, 1);

  // Assess
  expect(console.log).toHaveEmittedEMFWith(
    expect.objectContaining({
      service: 'hello-world',
    })
  );
  // With all invalid dimensions, we should only have the default dimension set
  expect(console.log).toHaveEmittedMetricWith(
    expect.objectContaining({
      Dimensions: [['service']],
    })
  );
});

it('throws when adding dimensions would exceed the maximum dimension count', () => {
  // Prepare
  const metrics = new Metrics({
    singleMetric: true,
  });

  // Mock getCurrentDimensionsCount to return a value close to the limit
  const getCurrentDimensionsCountSpy = vi.spyOn(
    metrics,
    'getCurrentDimensionsCount'
  );
  getCurrentDimensionsCountSpy.mockReturnValue(MAX_DIMENSION_COUNT - 1);

  // Act & Assert
  expect(() => {
    metrics.addDimensions({ oneMore: 'tooMany' });
  }).toThrow(RangeError);

  // Restore the mock
  getCurrentDimensionsCountSpy.mockRestore();
});
