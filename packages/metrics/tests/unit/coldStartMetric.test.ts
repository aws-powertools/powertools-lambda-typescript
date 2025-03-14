import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COLD_START_METRIC, DEFAULT_NAMESPACE } from '../../src/constants.js';
import { MetricUnit, Metrics } from '../../src/index.js';

describe('ColdStart metric', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
      POWERTOOLS_METRICS_DISABLED: 'false',
    };
    vi.clearAllMocks();
  });

  it('emits a cold start metric', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });

    // Act
    metrics.captureColdStartMetric();

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        [COLD_START_METRIC]: 1,
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service']],
        Metrics: [{ Name: COLD_START_METRIC, Unit: MetricUnit.Count }],
        Namespace: DEFAULT_NAMESPACE,
      })
    );
  });

  it('includes default dimensions in the cold start metric', () => {
    // Prepare
    const defaultDimensions = { MyDimension: 'MyValue' };
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
      defaultDimensions,
    });

    // Act
    metrics.captureColdStartMetric();

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        [COLD_START_METRIC]: 1,
        MyDimension: 'MyValue',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'MyDimension']],
      })
    );
  });

  it('includes the function name in the cold start metric', () => {
    // Prepare
    const functionName = 'my-function';
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });
    metrics.setFunctionName(functionName);

    // Act
    metrics.captureColdStartMetric();

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        [COLD_START_METRIC]: 1,
        function_name: 'my-function',
      })
    );
  });

  it('does not override the function name from constructor in the cold start metric', () => {
    // Prepare
    const functionName = 'my-function';
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
      functionName: 'another-function',
    });

    // Act
    metrics.captureColdStartMetric(functionName);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        service: 'hello-world',
        [COLD_START_METRIC]: 1,
        function_name: 'another-function',
      })
    );
  });

  it.each([
    {
      case: 'empty string',
      functionName: '',
    },
    {
      case: 'undefined',
      functionName: undefined,
    },
  ])(
    'does not include the function name if not set or invalid ($case)',
    ({ functionName }) => {
      // Prepare
      const metrics = new Metrics({
        namespace: DEFAULT_NAMESPACE,
      });

      // Act
      metrics.captureColdStartMetric(functionName);

      // Assess
      expect(console.log).toHaveEmittedEMFWith(
        expect.objectContaining({
          service: 'hello-world',
          [COLD_START_METRIC]: 1,
        })
      );
      expect(console.log).toHaveEmittedEMFWith(
        expect.not.objectContaining({
          function_name: 'my-function',
        })
      );
    }
  );

  it('emits the metric only once', () => {
    // Prepare
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });

    // Act
    metrics.captureColdStartMetric();
    metrics.captureColdStartMetric();

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
  });
});
