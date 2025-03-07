import { cleanupMiddlewares } from '@aws-lambda-powertools/commons';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COLD_START_METRIC, DEFAULT_NAMESPACE } from '../../src/constants.js';
import { MetricUnit, Metrics } from '../../src/index.js';
import { logMetrics } from '../../src/middleware/middy.js';

describe('LogMetrics decorator & Middy.js middleware', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = {
      ...ENVIRONMENT_VARIABLES,
      POWERTOOLS_DEV: 'true',
      POWERTOOLS_METRICS_DISABLED: 'false',
    };
    vi.clearAllMocks();
  });

  it('captures the cold start metric on the first invocation', async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    vi.spyOn(metrics, 'publishStoredMetrics');
    class Test {
      readonly #metricName: string;

      public constructor(name: string) {
        this.#metricName = name;
      }

      @metrics.logMetrics({ captureColdStartMetric: true })
      async handler(_event: unknown, _context: Context) {
        this.addGreetingMetric();
      }

      addGreetingMetric() {
        metrics.addMetric(this.#metricName, MetricUnit.Count, 1);
      }
    }
    const lambda = new Test('greetings');
    const handler = lambda.handler.bind(lambda);

    // Act
    await handler({}, {} as Context);
    await handler({}, {} as Context);

    // Assess
    expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledTimes(3);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        [COLD_START_METRIC]: 1,
        service: 'hello-world',
      })
    );
    expect(console.log).toHaveEmittedNthMetricWith(
      2,
      expect.objectContaining({
        Metrics: [
          {
            Name: 'greetings',
            Unit: 'Count',
          },
        ],
      })
    );
    expect(console.log).toHaveEmittedNthMetricWith(
      3,
      expect.objectContaining({
        Metrics: [
          {
            Name: 'greetings',
            Unit: 'Count',
          },
        ],
      })
    );
  });

  it('override the function name for cold start metric when using decorator', async () => {
    // Prepare
    const decoratorFunctionName = 'decorator-function-name';
    const functionName = 'function-name';
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    metrics.setFunctionName(functionName);

    vi.spyOn(metrics, 'publishStoredMetrics');
    class Test {
      readonly #metricName: string;

      public constructor(name: string) {
        this.#metricName = name;
      }

      @metrics.logMetrics({
        captureColdStartMetric: true,
        functionName: decoratorFunctionName,
      })
      async handler(_event: unknown, _context: Context) {
        this.addGreetingMetric();
      }

      addGreetingMetric() {
        metrics.addMetric(this.#metricName, MetricUnit.Count, 1);
      }
    }
    const lambda = new Test('greetings');
    const handler = lambda.handler.bind(lambda);

    // Act
    await handler({}, {} as Context);

    // Assess
    expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        [COLD_START_METRIC]: 1,
        service: 'hello-world',
        function_name: decoratorFunctionName,
      })
    );
  });

  it('captures the cold start metric on the first invocation when using the Middy.js middleware', async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    vi.spyOn(metrics, 'publishStoredMetrics');
    const handler = middy(async () => {
      metrics.addMetric('greetings', MetricUnit.Count, 1);
    }).use(logMetrics(metrics, { captureColdStartMetric: true }));

    // Act
    await handler({}, {} as Context);
    await handler({}, {} as Context);

    // Assess
    expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledTimes(3);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        [COLD_START_METRIC]: 1,
        service: 'hello-world',
      })
    );
  });

  it('sets the function name in the cold start metric when using the Middy.js middleware', async () => {
    // Prepare
    const contextFunctionName = 'lambda-function-context-name';
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });

    vi.spyOn(metrics, 'publishStoredMetrics');
    const handler = middy(async () => {
      metrics.addMetric('greetings', MetricUnit.Count, 1);
    }).use(logMetrics(metrics, { captureColdStartMetric: true }));

    // Act
    await handler({}, { functionName: contextFunctionName } as Context);

    // Assess
    expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        [COLD_START_METRIC]: 1,
        service: 'hello-world',
        function_name: contextFunctionName,
      })
    );
  });

  it('override the function name in the cold start metric when using the Middy.js middleware', async () => {
    // Prepare
    const contextFunctionName = 'lambda-function-context-name';
    const functionName = 'my-function';
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });
    metrics.setFunctionName(functionName);

    vi.spyOn(metrics, 'publishStoredMetrics');
    const overrideFunctionName = 'overwritten-function-name';
    const handler = middy(async () => {
      metrics.addMetric('greetings', MetricUnit.Count, 1);
    }).use(
      logMetrics(metrics, {
        captureColdStartMetric: true,
        functionName: overrideFunctionName,
      })
    );

    // Act
    await handler({}, { functionName: contextFunctionName } as Context);

    // Assess
    expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        [COLD_START_METRIC]: 1,
        service: 'hello-world',
        function_name: overrideFunctionName,
      })
    );
  });

  it('does not override existing function name in the cold start metric when using the Middy.js middleware', async () => {
    // Prepare
    const functionName = 'my-function';
    const metrics = new Metrics({
      namespace: DEFAULT_NAMESPACE,
    });
    metrics.setFunctionName(functionName);

    vi.spyOn(metrics, 'publishStoredMetrics');
    const handler = middy(async () => {
      metrics.addMetric('greetings', MetricUnit.Count, 1);
    }).use(logMetrics(metrics, { captureColdStartMetric: true }));

    // Act
    await handler({}, {} as Context);

    // Assess
    expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        [COLD_START_METRIC]: 1,
        service: 'hello-world',
        function_name: functionName,
      })
    );
  });

  it('includes default dimensions passed in the decorator', async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    class Test {
      @metrics.logMetrics({ defaultDimensions: { environment: 'test' } })
      async handler(_event: unknown, _context: Context) {
        metrics.addMetric('test', MetricUnit.Count, 1);
      }
    }
    const lambda = new Test();
    const handler = lambda.handler.bind(lambda);

    // Act
    await handler({}, {} as Context);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        test: 1,
        service: 'hello-world',
        environment: 'test',
      })
    );
  });

  it('includes default dimensions passed in the decorator when using the Middy.js middleware', async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    vi.spyOn(metrics, 'publishStoredMetrics');
    const handler = middy(async () => {
      metrics.addMetric('greetings', MetricUnit.Count, 1);
    }).use(
      logMetrics(metrics, {
        defaultDimensions: {
          environment: 'test',
        },
      })
    );

    // Act
    await handler({}, {} as Context);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({
        greetings: 1,
        service: 'hello-world',
        environment: 'test',
      })
    );
  });

  it("doesn't swallow errors when the decorated function throws", async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    class Test {
      @metrics.logMetrics()
      async handler(_event: unknown, _context: Context) {
        throw new Error('Something went wrong');
      }
    }
    const lambda = new Test();
    const handler = lambda.handler.bind(lambda);

    // Act & Assess
    await expect(handler({}, {} as Context)).rejects.toThrowError(
      'Something went wrong'
    );
  });

  it('throws when no metrics are added and throwOnEmptyMetrics is true', async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    class Test {
      @metrics.logMetrics({ throwOnEmptyMetrics: true })
      async handler(_event: unknown, _context: Context) {
        return 'Hello, world!';
      }
    }
    const lambda = new Test();
    const handler = lambda.handler.bind(lambda);

    // Act & Assess
    await expect(handler({}, {} as Context)).rejects.toThrowError(
      'The number of metrics recorded must be higher than zero'
    );
  });

  it('throws when no metrics are added and throwOnEmptyMetrics is true when using the Middy.js middleware', async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    const handler = middy(async () => {}).use(
      logMetrics([metrics], { throwOnEmptyMetrics: true })
    );

    // Act & Assess
    expect(() => handler({}, {} as Context)).rejects.toThrowError(
      'The number of metrics recorded must be higher than zero'
    );
  });

  it('flushes the metrics even when a previous middleware returns early', async () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: false,
      namespace: DEFAULT_NAMESPACE,
    });
    vi.spyOn(metrics, 'publishStoredMetrics');
    const myCustomMiddleware = (): middy.MiddlewareObj => {
      const before = async (
        request: middy.Request
      ): Promise<undefined | string> => {
        // Return early on the second invocation
        if (request.event.idx === 1) {
          // Cleanup Powertools resources
          await cleanupMiddlewares(request);

          // Then return early
          return 'foo';
        }
      };

      return {
        before,
      };
    };
    const handler = middy(() => {
      metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
    })
      .use(logMetrics(metrics))
      .use(myCustomMiddleware());

    // Act
    await handler({ idx: 0 }, {} as Context);
    await handler({ idx: 1 }, {} as Context);

    // Assess
    expect(metrics.publishStoredMetrics).toHaveBeenCalledTimes(2);
  });
});
