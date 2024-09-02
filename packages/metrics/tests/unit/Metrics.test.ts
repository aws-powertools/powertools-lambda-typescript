/**
 * Test Metrics class
 *
 * @group unit/metrics/class
 */
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context, Handler } from 'aws-lambda';
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';
import {
  COLD_START_METRIC,
  DEFAULT_NAMESPACE,
  MAX_DIMENSION_COUNT,
  MAX_METRICS_SIZE,
  MAX_METRIC_VALUES_SIZE,
} from '../../src/constants.js';
import { MetricResolution, MetricUnit, Metrics } from '../../src/index.js';
import type {
  ConfigServiceInterface,
  Dimensions,
  EmfOutput,
  MetricsOptions,
} from '../../src/types/index.js';
import { setupDecoratorLambdaHandler } from '../helpers/metricsUtils.js';

jest.mock('node:console', () => ({
  ...jest.requireActual('node:console'),
  Console: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
  })),
}));
jest.spyOn(console, 'warn').mockImplementation(() => ({}));
const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
jest.spyOn(console, 'log').mockImplementation();
jest.spyOn(console, 'warn').mockImplementation();

interface LooseObject {
  [key: string]: string;
}

describe('Class: Metrics', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const TEST_NAMESPACE = 'test';
  const event = {
    foo: 'bar',
    bar: 'baz',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    dateSpy.mockClear();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  describe('Method: constructor', () => {
    test('when no constructor parameters are set, creates instance with the options set in the environment variables', () => {
      // Prepare
      const metricsOptions = undefined;

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: undefined,
          defaultDimensions: {
            service: 'service_undefined',
          },
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: false,
          metadata: {},
          namespace: 'hello-world',
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });

    test('when no constructor parameters and no environment variables are set, creates instance with the default properties', () => {
      // Prepare
      const metricsOptions = undefined;
      process.env = {};

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: undefined,
          defaultDimensions: {
            service: 'service_undefined',
          },
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: false,
          metadata: {},
          namespace: '',
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });

    test('when constructor parameters are set, creates instance with the options set in the constructor parameters', () => {
      // Prepare
      const metricsOptions: MetricsOptions = {
        customConfigService: new EnvironmentVariablesService(),
        namespace: TEST_NAMESPACE,
        serviceName: 'test-service',
        singleMetric: true,
        defaultDimensions: {
          service: 'order',
        },
      };

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: expect.any(EnvironmentVariablesService),
          defaultDimensions: metricsOptions.defaultDimensions,
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: true,
          metadata: {},
          namespace: metricsOptions.namespace,
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });

    test('when custom namespace is passed, creates instance with the correct properties', () => {
      // Prepare
      const metricsOptions: MetricsOptions = {
        namespace: TEST_NAMESPACE,
      };

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: undefined,
          defaultDimensions: {
            service: 'service_undefined',
          },
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: false,
          metadata: {},
          namespace: metricsOptions.namespace,
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });

    test('when custom defaultDimensions is passed, creates instance with the correct properties', () => {
      // Prepare
      const metricsOptions: MetricsOptions = {
        defaultDimensions: {
          service: 'order',
        },
      };

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: undefined,
          defaultDimensions: metricsOptions.defaultDimensions,
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: false,
          metadata: {},
          namespace: 'hello-world',
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });

    test('when singleMetric is passed, creates instance with the correct properties', () => {
      // Prepare
      const metricsOptions: MetricsOptions = {
        singleMetric: true,
      };

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: undefined,
          defaultDimensions: {
            service: 'service_undefined',
          },
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: true,
          metadata: {},
          namespace: 'hello-world',
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });

    test('when custom customConfigService is passed, creates instance with the correct properties', () => {
      // Prepare
      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getNamespace(): string {
          return TEST_NAMESPACE;
        },
        getServiceName(): string {
          return 'test-service';
        },
        getXrayTraceId(): string | undefined {
          return 'test-trace-id';
        },
        getXrayTraceSampled(): boolean {
          return true;
        },
        isDevMode(): boolean {
          return false;
        },
        isValueTrue(value: string): boolean {
          return value === 'true';
        },
      };
      const metricsOptions: MetricsOptions = {
        customConfigService: configService,
      };

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: configService,
          defaultDimensions: {
            service: 'test-service',
          },
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: false,
          metadata: {},
          namespace: TEST_NAMESPACE,
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });

    test('when custom serviceName is passed, creates instance with the correct properties', () => {
      // Prepare
      const metricsOptions: MetricsOptions = {
        serviceName: 'test-service',
      };

      // Act
      const metrics: Metrics = new Metrics(metricsOptions);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          coldStart: true,
          customConfigService: undefined,
          defaultDimensions: {
            service: 'test-service',
          },
          defaultServiceName: 'service_undefined',
          dimensions: {},
          envVarsService: expect.any(EnvironmentVariablesService),
          isSingleMetric: false,
          metadata: {},
          namespace: 'hello-world',
          shouldThrowOnEmptyMetrics: false,
          storedMetrics: {},
        })
      );
    });
  });

  describe('Method: addDimension', () => {
    test('when called, it should store dimensions', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';

      // Act
      metrics.addDimension(dimensionName, dimensionValue);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          dimensions: {
            [dimensionName]: dimensionValue,
          },
        })
      );
    });

    test('it should update existing dimension value if same dimension is added again', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const dimensionName = 'test-dimension';

      // Act
      metrics.addDimension(dimensionName, 'test-value-1');
      metrics.addDimension(dimensionName, 'test-value-2');

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          dimensions: {
            [dimensionName]: 'test-value-2',
          },
        })
      );
    });

    test('it should throw error if the number of dimensions exceeds the maximum allowed', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';

      // Act & Assess
      // Starts from 1 because the service dimension is already added by default
      expect(() => {
        for (let i = 1; i < MAX_DIMENSION_COUNT; i++) {
          metrics.addDimension(
            `${dimensionName}-${i}`,
            `${dimensionValue}-${i}`
          );
        }
      }).not.toThrowError();
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['defaultDimensions']).length).toBe(1);
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['dimensions']).length).toBe(
        MAX_DIMENSION_COUNT - 1
      );
      expect(() =>
        metrics.addDimension('another-dimension', 'another-dimension-value')
      ).toThrowError(
        `The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
      );
    });

    test('it should take consideration of defaultDimensions while throwing error if number of dimensions exceeds the maximum allowed', () => {
      // Prepare
      const defaultDimensions: LooseObject = {
        environment: 'dev',
        foo: 'bar',
      };
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        defaultDimensions,
      });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';

      // Act & Assess
      // Starts from 3 because three default dimensions are already set (service, environment, foo)
      expect(() => {
        for (let i = 3; i < MAX_DIMENSION_COUNT; i++) {
          metrics.addDimension(
            `${dimensionName}-${i}`,
            `${dimensionValue}-${i}`
          );
        }
      }).not.toThrowError();
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['defaultDimensions']).length).toBe(3);
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['dimensions']).length).toBe(
        MAX_DIMENSION_COUNT - 3
      );
      expect(() =>
        metrics.addDimension('another-dimension', 'another-dimension-value')
      ).toThrowError(
        `The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
      );
    });
  });

  describe('Method: addDimensions', () => {
    test('it should add multiple dimensions', () => {
      // Prepare
      const dimensionsToBeAdded: LooseObject = {
        'test-dimension-1': 'test-value-1',
        'test-dimension-2': 'test-value-2',
      };
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addDimensions(dimensionsToBeAdded);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          dimensions: dimensionsToBeAdded,
        })
      );
    });

    test('it should update existing dimension value if same dimension is added again', () => {
      // Prepare
      const dimensionsToBeAdded: LooseObject = {
        'test-dimension-1': 'test-value-1',
        'test-dimension-2': 'test-value-2',
      };
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addDimensions(dimensionsToBeAdded);
      metrics.addDimensions({ 'test-dimension-1': 'test-value-3' });

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          dimensions: {
            'test-dimension-1': 'test-value-3',
            'test-dimension-2': 'test-value-2',
          },
        })
      );
    });

    test('it should successfully add up to maximum allowed dimensions without throwing error', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const dimensionsToBeAdded: LooseObject = {};
      for (let i = 0; i < MAX_DIMENSION_COUNT; i++) {
        dimensionsToBeAdded[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }

      // Act & Assess
      expect(() =>
        metrics.addDimensions(dimensionsToBeAdded)
      ).not.toThrowError();
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['dimensions']).length).toBe(
        MAX_DIMENSION_COUNT
      );
    });

    test('it should throw error if number of dimensions exceeds the maximum allowed', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const dimensionsToBeAdded: LooseObject = {};
      for (let i = 0; i < MAX_DIMENSION_COUNT; i++) {
        dimensionsToBeAdded[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }

      // Act & Assess
      metrics.addDimensions(dimensionsToBeAdded);
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['dimensions']).length).toBe(
        MAX_DIMENSION_COUNT
      );
      expect(() =>
        metrics.addDimensions({
          'another-dimension': 'another-dimension-value',
        })
      ).toThrowError(
        `Unable to add 1 dimensions: the number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
      );
    });
  });

  describe('Method: addMetadata', () => {
    test('it should add metadata', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetadata('foo', 'bar');

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          metadata: { foo: 'bar' },
        })
      );
    });

    test('it should update existing metadata value if same metadata is added again', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetadata('foo', 'bar');
      metrics.addMetadata('foo', 'baz');

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          metadata: { foo: 'baz' },
        })
      );
    });
  });

  describe('Method: addMetric', () => {
    test('it should store metrics when called', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const metricName = 'test-metric';

      // Act
      metrics.addMetric(metricName, MetricUnit.Count, 1, MetricResolution.High);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          storedMetrics: {
            [metricName]: {
              name: metricName,
              resolution: MetricResolution.High,
              unit: MetricUnit.Count,
              value: 1,
            },
          },
        })
      );
    });

    test('it should store multiple metrics when called with multiple metric name', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(
        'test-metric-1',
        MetricUnit.Count,
        1,
        MetricResolution.High
      );
      metrics.addMetric(
        'test-metric-2',
        MetricUnit.Count,
        3,
        MetricResolution.High
      );
      metrics.addMetric(
        'test-metric-3',
        MetricUnit.Count,
        6,
        MetricResolution.High
      );

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          storedMetrics: {
            'test-metric-1': {
              name: 'test-metric-1',
              resolution: MetricResolution.High,
              unit: MetricUnit.Count,
              value: 1,
            },
            'test-metric-2': {
              name: 'test-metric-2',
              resolution: MetricResolution.High,
              unit: MetricUnit.Count,
              value: 3,
            },
            'test-metric-3': {
              name: 'test-metric-3',
              resolution: MetricResolution.High,
              unit: MetricUnit.Count,
              value: 6,
            },
          },
        })
      );
    });

    test('it should store metrics with standard resolution when called without resolution', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric('test-metric-1', MetricUnit.Count, 1);
      metrics.addMetric('test-metric-2', MetricUnit.Seconds, 3);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          storedMetrics: {
            'test-metric-1': {
              name: 'test-metric-1',
              resolution: MetricResolution.Standard,
              unit: MetricUnit.Count,
              value: 1,
            },
            'test-metric-2': {
              name: 'test-metric-2',
              resolution: MetricResolution.Standard,
              unit: MetricUnit.Seconds,
              value: 3,
            },
          },
        })
      );
    });

    test('it should group the metric values together in an array when trying to add same metric with different values', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const metricName = 'test-metric';

      // Act
      metrics.addMetric(metricName, MetricUnit.Count, 1);
      metrics.addMetric(metricName, MetricUnit.Count, 5);
      metrics.addMetric(metricName, MetricUnit.Count, 1);
      metrics.addMetric(metricName, MetricUnit.Count, 4);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          storedMetrics: {
            [metricName]: {
              name: metricName,
              resolution: MetricResolution.Standard,
              unit: MetricUnit.Count,
              value: [1, 5, 1, 4],
            },
          },
        })
      );
    });

    test('it should throw an error when trying to add same metric with different unit', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const metricName = 'test-metric';

      // Act & Assess
      expect(() => {
        metrics.addMetric(metricName, MetricUnit.Count, 1);
        metrics.addMetric(metricName, MetricUnit.Kilobits, 5);
      }).toThrowError(
        `Metric "${metricName}" has already been added with unit "${MetricUnit.Count}", but we received unit "${MetricUnit.Kilobits}". Did you mean to use metric unit "${MetricUnit.Count}"?`
      );
    });

    test('it should publish metrics if stored metrics count has already reached max metric size threshold & then store remaining metric', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const publishStoredMetricsSpy = jest.spyOn(
        metrics,
        'publishStoredMetrics'
      );
      const metricName = 'test-metric';

      // Act & Assess
      expect(() => {
        for (let i = 0; i < MAX_METRICS_SIZE; i++) {
          metrics.addMetric(`${metricName}-${i}`, MetricUnit.Count, i);
        }
      }).not.toThrowError();
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['storedMetrics']).length).toEqual(
        MAX_METRICS_SIZE
      );
      metrics.addMetric(
        'another-metric',
        MetricUnit.Count,
        MAX_METRICS_SIZE + 1
      );
      expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(1);
      expect(metrics).toEqual(
        expect.objectContaining({
          storedMetrics: {
            'another-metric': {
              name: 'another-metric',
              resolution: MetricResolution.Standard,
              unit: MetricUnit.Count,
              value: MAX_METRICS_SIZE + 1,
            },
          },
        })
      );
    });

    test('it should publish metrics when the array of values reaches the maximum size', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      const consoleSpy = jest.spyOn(metrics['console'], 'log');
      const metricName = 'test-metric';

      // Act
      for (let i = 0; i <= MAX_METRIC_VALUES_SIZE; i++) {
        metrics.addMetric(`${metricName}`, MetricUnit.Count, i);
      }
      metrics.publishStoredMetrics();

      // Assess
      // 2 calls to console.log: 1 for the first batch of metrics, 1 for the second batch (explicit call)
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const firstMetricsJson = JSON.parse(
        consoleSpy.mock.calls[0][0]
      ) as EmfOutput;
      const secondMetricsJson = JSON.parse(
        consoleSpy.mock.calls[1][0]
      ) as EmfOutput;

      // The first batch of values should be an array of size MAX_METRIC_VALUES_SIZE
      expect(firstMetricsJson[metricName]).toHaveLength(MAX_METRIC_VALUES_SIZE);
      // The second should be a single value (the last value added, which is 100 given we start from 0)
      expect(secondMetricsJson[metricName]).toEqual(100);
    });

    test('it should not publish metrics if stored metrics count has not reached max metric size threshold', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const publishStoredMetricsSpy = jest.spyOn(
        metrics,
        'publishStoredMetrics'
      );
      const metricName = 'test-metric';

      // Act & Assess
      expect(() => {
        for (let i = 0; i < MAX_METRICS_SIZE - 1; i++) {
          metrics.addMetric(`${metricName}-${i}`, MetricUnit.Count, i);
        }
      }).not.toThrowError();
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['storedMetrics']).length).toEqual(
        MAX_METRICS_SIZE - 1
      );
      metrics.addMetric('another-metric', MetricUnit.Count, MAX_METRICS_SIZE);
      expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(0);
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['storedMetrics']).length).toEqual(
        MAX_METRICS_SIZE
      );
    });

    test('it should publish metrics on every call if singleMetric is set to true', () => {
      // Prepare
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: true,
      });
      const publishStoredMetricsSpy = jest.spyOn(
        metrics,
        'publishStoredMetrics'
      );

      // Act
      metrics.addMetric('test-metric-1', MetricUnit.Count, 1);
      metrics.addMetric('test-metric-2', MetricUnit.Bits, 100);

      // Assess
      expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(2);
    });

    test('it should not publish metrics on every call if singleMetric is set to false', () => {
      // Prepare
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: false,
      });
      const publishStoredMetricsSpy = jest.spyOn(
        metrics,
        'publishStoredMetrics'
      );

      // Act
      metrics.addMetric('test-metric-1', MetricUnit.Count, 1);
      metrics.addMetric('test-metric-2', MetricUnit.Bits, 100);

      // Assess
      expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(0);
    });

    test('it should not publish metrics on every call if singleMetric is not provided', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const publishStoredMetricsSpy = jest.spyOn(
        metrics,
        'publishStoredMetrics'
      );

      // Act
      metrics.addMetric('test-metric-1', MetricUnit.Count, 1);
      metrics.addMetric('test-metric-2', MetricUnit.Bits, 100);

      // Assess
      expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Methods: captureColdStartMetric', () => {
    test('it should call addMetric with correct parameters', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const singleMetricMock: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: true,
      });
      const singleMetricSpy = jest
        .spyOn(metrics, 'singleMetric')
        .mockImplementation(() => singleMetricMock);
      const addMetricSpy = jest.spyOn(singleMetricMock, 'addMetric');

      // Act
      metrics.captureColdStartMetric();

      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(addMetricSpy).toBeCalledTimes(1);
      expect(addMetricSpy).toBeCalledWith(
        COLD_START_METRIC,
        MetricUnit.Count,
        1
      );
    });

    test('it should call setDefaultDimensions with correct parameters', () => {
      // Prepare
      const defaultDimensions: Dimensions = {
        foo: 'bar',
        service: 'order',
      };
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        defaultDimensions,
      });
      const singleMetricMock: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: true,
      });
      const singleMetricSpy = jest
        .spyOn(metrics, 'singleMetric')
        .mockImplementation(() => singleMetricMock);
      const setDefaultDimensionsSpy = jest.spyOn(
        singleMetricMock,
        'setDefaultDimensions'
      );

      // Act
      metrics.captureColdStartMetric();

      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledWith({
        service: defaultDimensions.service,
      });
    });

    test('it should call setDefaultDimensions with correct parameters when defaultDimensions are not set', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const singleMetricMock: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: true,
      });
      const singleMetricSpy = jest
        .spyOn(metrics, 'singleMetric')
        .mockImplementation(() => singleMetricMock);
      const setDefaultDimensionsSpy = jest.spyOn(
        singleMetricMock,
        'setDefaultDimensions'
      );

      // Act
      metrics.captureColdStartMetric();

      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledWith({
        service: 'service_undefined',
      });
    });

    test('it should call addDimension, if functionName is set', () => {
      // Prepare
      const functionName = 'coldStart';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.setFunctionName(functionName);
      const singleMetricMock: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: true,
      });
      const singleMetricSpy = jest
        .spyOn(metrics, 'singleMetric')
        .mockImplementation(() => singleMetricMock);
      const addDimensionSpy = jest.spyOn(singleMetricMock, 'addDimension');

      // Act
      metrics.captureColdStartMetric();

      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(addDimensionSpy).toBeCalledTimes(1);
      expect(addDimensionSpy).toBeCalledWith('function_name', functionName);
    });

    test('it should not call addDimension, if functionName is not set', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const singleMetricMock: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: true,
      });
      const singleMetricSpy = jest
        .spyOn(metrics, 'singleMetric')
        .mockImplementation(() => singleMetricMock);
      const addDimensionSpy = jest.spyOn(singleMetricMock, 'addDimension');

      // Act
      metrics.captureColdStartMetric();

      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(addDimensionSpy).toBeCalledTimes(0);
    });

    test('it should not call any function, if there is no cold start', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      jest.spyOn(metrics, 'isColdStart').mockImplementation(() => false);

      const singleMetricMock: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        singleMetric: true,
      });
      const singleMetricSpy = jest
        .spyOn(metrics, 'singleMetric')
        .mockImplementation(() => singleMetricMock);
      const addMetricSpy = jest.spyOn(singleMetricMock, 'addMetric');
      const setDefaultDimensionsSpy = jest.spyOn(
        singleMetricMock,
        'setDefaultDimensions'
      );
      const addDimensionSpy = jest.spyOn(singleMetricMock, 'addDimension');

      // Act
      metrics.captureColdStartMetric();

      // Assess
      expect(singleMetricSpy).toBeCalledTimes(0);
      expect(setDefaultDimensionsSpy).toBeCalledTimes(0);
      expect(addDimensionSpy).toBeCalledTimes(0);
      expect(addMetricSpy).toBeCalledTimes(0);
    });
  });

  describe('Method: clearDefaultDimensions', () => {
    test('it should clear all default dimensions', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.setDefaultDimensions({ foo: 'bar' });

      // Act
      metrics.clearDefaultDimensions();

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          defaultDimensions: {},
        })
      );
    });

    test('it should only clear default dimensions', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.setDefaultDimensions({ foo: 'bar' });
      metrics.addDimension('environment', 'dev');

      // Act
      metrics.clearDefaultDimensions();

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          defaultDimensions: {},
          dimensions: {
            environment: 'dev',
          },
        })
      );
    });
  });

  describe('Method: clearDimensions', () => {
    test('it should clear all dimensions', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.addDimension('foo', 'bar');

      // Act
      metrics.clearDimensions();

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          dimensions: {},
        })
      );
    });

    test('it should only clear dimensions', () => {
      // Prepare
      const metrics: Metrics = new Metrics({
        defaultDimensions: { environment: 'dev' },
      });
      metrics.addDimension('foo', 'bar');

      // Act
      metrics.clearDimensions();

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          dimensions: {},
          defaultDimensions: {
            environment: 'dev',
            service: 'service_undefined',
          },
        })
      );
    });
  });

  describe('Method: clearMetadata', () => {
    test('it should clear all metadata', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.addMetadata('foo', 'bar');
      metrics.addMetadata('test', 'baz');

      // Act
      metrics.clearMetadata();

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          metadata: {},
        })
      );
    });
  });

  describe('Method: clearMetrics', () => {
    test('it should clear stored metrics', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const metricName = 'test-metric';

      // Act
      metrics.addMetric(metricName, MetricUnit.Count, 1);
      metrics.clearMetrics();

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          storedMetrics: {},
        })
      );
    });
  });

  describe('Method: logMetrics', () => {
    let metrics: Metrics;
    let publishStoredMetricsSpy: jest.SpyInstance;
    let addMetricSpy: jest.SpyInstance;
    let captureColdStartMetricSpy: jest.SpyInstance;
    let throwOnEmptyMetricsSpy: jest.SpyInstance;
    let setDefaultDimensionsSpy: jest.SpyInstance;
    const decoratorLambdaExpectedReturnValue = 'Lambda invoked!';
    const decoratorLambdaMetric = 'decorator-lambda-test-metric';

    beforeEach(() => {
      metrics = new Metrics({ namespace: TEST_NAMESPACE });
      publishStoredMetricsSpy = jest.spyOn(metrics, 'publishStoredMetrics');
      addMetricSpy = jest.spyOn(metrics, 'addMetric');
      captureColdStartMetricSpy = jest.spyOn(metrics, 'captureColdStartMetric');
      throwOnEmptyMetricsSpy = jest.spyOn(metrics, 'throwOnEmptyMetrics');
      setDefaultDimensionsSpy = jest.spyOn(metrics, 'setDefaultDimensions');
    });

    test('it should execute lambda function & publish stored metrics', async () => {
      // Prepare
      const handler: Handler = setupDecoratorLambdaHandler(metrics);

      // Act
      const actualResult = await handler(event, context, () =>
        console.log('callback')
      );

      // Assess
      expect(actualResult).toEqual(decoratorLambdaExpectedReturnValue);
      expect(addMetricSpy).toHaveBeenNthCalledWith(
        1,
        decoratorLambdaMetric,
        MetricUnit.Count,
        1
      );
      expect(publishStoredMetricsSpy).toBeCalledTimes(1);
      expect(captureColdStartMetricSpy).not.toBeCalled();
      expect(throwOnEmptyMetricsSpy).not.toBeCalled();
      expect(setDefaultDimensionsSpy).not.toBeCalled();
    });

    test('it should capture cold start metrics, if passed in the options as true', async () => {
      // Prepare
      const handler: Handler = setupDecoratorLambdaHandler(metrics, {
        captureColdStartMetric: true,
      });

      // Act
      const actualResult = await handler(event, context, () =>
        console.log('callback')
      );

      // Assess
      expect(actualResult).toEqual(decoratorLambdaExpectedReturnValue);
      expect(addMetricSpy).toHaveBeenNthCalledWith(
        1,
        decoratorLambdaMetric,
        MetricUnit.Count,
        1
      );
      expect(captureColdStartMetricSpy).toBeCalledTimes(1);
      expect(publishStoredMetricsSpy).toBeCalledTimes(1);
      expect(throwOnEmptyMetricsSpy).not.toBeCalled();
      expect(setDefaultDimensionsSpy).not.toBeCalled();
    });

    test('it should call throwOnEmptyMetrics, if passed in the options as true', async () => {
      // Prepare
      const handler: Handler = setupDecoratorLambdaHandler(metrics, {
        throwOnEmptyMetrics: true,
      });

      // Act
      const actualResult = await handler(event, context, () =>
        console.log('callback')
      );

      // Assess
      expect(actualResult).toEqual(decoratorLambdaExpectedReturnValue);
      expect(addMetricSpy).toHaveBeenNthCalledWith(
        1,
        decoratorLambdaMetric,
        MetricUnit.Count,
        1
      );
      expect(throwOnEmptyMetricsSpy).toBeCalledTimes(1);
      expect(publishStoredMetricsSpy).toBeCalledTimes(1);
      expect(captureColdStartMetricSpy).not.toBeCalled();
      expect(setDefaultDimensionsSpy).not.toBeCalled();
    });

    test('it should set default dimensions if passed in the options as true', async () => {
      // Prepare
      const defaultDimensions = {
        foo: 'bar',
        service: 'order',
      };
      const handler: Handler = setupDecoratorLambdaHandler(metrics, {
        defaultDimensions,
      });

      // Act
      const actualResult = await handler(event, context, () =>
        console.log('callback')
      );

      // Assess
      expect(actualResult).toEqual(decoratorLambdaExpectedReturnValue);
      expect(addMetricSpy).toHaveBeenNthCalledWith(
        1,
        decoratorLambdaMetric,
        MetricUnit.Count,
        1
      );
      expect(setDefaultDimensionsSpy).toHaveBeenNthCalledWith(
        1,
        defaultDimensions
      );
      expect(publishStoredMetricsSpy).toBeCalledTimes(1);
      expect(throwOnEmptyMetricsSpy).not.toBeCalled();
      expect(captureColdStartMetricSpy).not.toBeCalled();
    });

    test('it should throw error if lambda handler throws any error', async () => {
      // Prepare
      const errorMessage = 'Unexpected error occurred!';
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<string> {
          throw new Error(errorMessage);
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act & Assess
      await expect(handler(event, context)).rejects.toThrowError(errorMessage);
    });
  });

  describe('Methods: publishStoredMetrics', () => {
    test('it should log warning if no metrics are added & throwOnEmptyMetrics is false', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      metrics.publishStoredMetrics();

      // Assess
      expect(consoleWarnSpy).toBeCalledTimes(1);
      expect(consoleWarnSpy).toBeCalledWith(
        'No application metrics to publish. The cold-start metric may be published if enabled. If application metrics should never be empty, consider using `throwOnEmptyMetrics`'
      );
    });

    test('it should call serializeMetrics && log the stringified return value of serializeMetrics', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.addMetric('test-metric', MetricUnit.Count, 10);
      const consoleLogSpy = jest
        // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
        .spyOn(metrics['console'], 'log')
        .mockImplementation();
      const mockData: EmfOutput = {
        _aws: {
          Timestamp: mockDate.getTime(),
          CloudWatchMetrics: [
            {
              Namespace: 'test',
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: 'test-metric',
                  Unit: MetricUnit.Count,
                },
              ],
            },
          ],
        },
        service: 'service_undefined',
        'test-metric': 10,
      };
      const serializeMetricsSpy = jest
        .spyOn(metrics, 'serializeMetrics')
        .mockImplementation(() => mockData);

      // Act
      metrics.publishStoredMetrics();

      // Assess
      expect(serializeMetricsSpy).toBeCalledTimes(1);
      expect(consoleLogSpy).toBeCalledTimes(1);
      expect(consoleLogSpy).toBeCalledWith(JSON.stringify(mockData));
    });

    test('it should call clearMetrics function', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.addMetric('test-metric', MetricUnit.Count, 10);
      const clearMetricsSpy = jest.spyOn(metrics, 'clearMetrics');

      // Act
      metrics.publishStoredMetrics();

      // Assess
      expect(clearMetricsSpy).toBeCalledTimes(1);
    });

    test('it should call clearDimensions function', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.addMetric('test-metric', MetricUnit.Count, 10);
      const clearDimensionsSpy = jest.spyOn(metrics, 'clearDimensions');

      // Act
      metrics.publishStoredMetrics();

      // Assess
      expect(clearDimensionsSpy).toBeCalledTimes(1);
    });

    test('it should call clearMetadata function', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      metrics.addMetric('test-metric', MetricUnit.Count, 10);
      const clearMetadataSpy = jest.spyOn(metrics, 'clearMetadata');

      // Act
      metrics.publishStoredMetrics();

      // Assess
      expect(clearMetadataSpy).toBeCalledTimes(1);
    });
  });

  describe('Method: serializeMetrics', () => {
    const defaultServiceName = 'service_undefined';

    test('it should print warning, if no namespace provided in constructor or environment variable', () => {
      // Prepare
      process.env.POWERTOOLS_METRICS_NAMESPACE = '';
      const metrics: Metrics = new Metrics();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      metrics.serializeMetrics();

      // Assess
      expect(consoleWarnSpy).toBeCalledWith(
        'Namespace should be defined, default used'
      );
    });

    test('it should return right object compliant with Cloudwatch EMF', () => {
      // Prepare
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        serviceName: 'test-service',
        defaultDimensions: {
          environment: 'dev',
        },
      });

      // Act
      metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
      metrics.addMetric('successfulBooking', MetricUnit.Count, 3);
      metrics.addMetric(
        'failedBooking',
        MetricUnit.Count,
        1,
        MetricResolution.High
      );
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData).toEqual({
        _aws: {
          Timestamp: mockDate.getTime(),
          CloudWatchMetrics: [
            {
              Namespace: TEST_NAMESPACE,
              Dimensions: [['service', 'environment']],
              Metrics: [
                {
                  Name: 'successfulBooking',
                  Unit: MetricUnit.Count,
                },
                {
                  Name: 'failedBooking',
                  Unit: MetricUnit.Count,
                  StorageResolution: 1,
                },
              ],
            },
          ],
        },
        environment: 'dev',
        service: 'test-service',
        successfulBooking: [1, 3],
        failedBooking: 1,
      });
    });

    test('it should log service dimension correctly when passed', () => {
      // Prepare
      const serviceName = 'test-service';
      const testMetric = 'test-metric';
      const metrics: Metrics = new Metrics({
        serviceName: serviceName,
        namespace: TEST_NAMESPACE,
      });

      // Act
      metrics.addMetric(testMetric, MetricUnit.Count, 10);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData.service).toEqual(serviceName);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: testMetric,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: serviceName,
        [testMetric]: 10,
      });
    });

    test('it should log service dimension correctly using environment variable when not specified in constructor', () => {
      // Prepare
      const serviceName = 'hello-world-service';
      process.env.POWERTOOLS_SERVICE_NAME = serviceName;
      const testMetric = 'test-metric';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(testMetric, MetricUnit.Count, 10);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData.service).toEqual(serviceName);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: testMetric,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: serviceName,
        [testMetric]: 10,
      });
    });

    test('it should log default dimensions correctly', () => {
      // Prepare
      const additionalDimensions = {
        foo: 'bar',
        env: 'dev',
      };
      const testMetric = 'test-metric';
      const metrics: Metrics = new Metrics({
        defaultDimensions: additionalDimensions,
        namespace: TEST_NAMESPACE,
      });

      // Act
      metrics.addMetric(testMetric, MetricUnit.Count, 10);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(
        3
      );
      expect(loggedData.service).toEqual(defaultServiceName);
      expect(loggedData.foo).toEqual(additionalDimensions.foo);
      expect(loggedData.env).toEqual(additionalDimensions.env);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service', 'foo', 'env']],
              Metrics: [
                {
                  Name: testMetric,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [testMetric]: 10,
        env: 'dev',
        foo: 'bar',
      });
    });

    test('it should log dimensions once when default dimensions are set and addDimension is called', () => {
      // Prepare
      const additionalDimensions = {
        foo: 'bar',
        env: 'dev',
      };
      const testMetric = 'test-metric';
      const metrics: Metrics = new Metrics({
        defaultDimensions: additionalDimensions,
        namespace: TEST_NAMESPACE,
      });

      // Act
      metrics.addMetric(testMetric, MetricUnit.Count, 10);
      metrics.addDimension('foo', 'baz');
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(
        3
      );
      expect(loggedData.service).toEqual(defaultServiceName);
      expect(loggedData.foo).toEqual('baz');
      expect(loggedData.env).toEqual(additionalDimensions.env);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service', 'foo', 'env']],
              Metrics: [
                {
                  Name: testMetric,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [testMetric]: 10,
        env: 'dev',
        foo: 'baz',
      });
    });

    test('it should log additional dimensions correctly', () => {
      // Prepare
      const testMetric = 'test-metric';
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(
        'test-metric',
        MetricUnit.Count,
        10,
        MetricResolution.High
      );
      metrics.addDimension(additionalDimension.name, additionalDimension.value);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(
        2
      );
      expect(loggedData.service).toEqual(defaultServiceName);
      expect(loggedData[additionalDimension.name]).toEqual(
        additionalDimension.value
      );
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service', 'metric2']],
              Metrics: [
                {
                  Name: testMetric,
                  StorageResolution: 1,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [testMetric]: 10,
        metric2: 'metric2Value',
      });
    });

    test('it should log additional bulk dimensions correctly', () => {
      // Prepare
      const testMetric = 'test-metric';
      const additionalDimensions: LooseObject = {
        metric2: 'metric2Value',
        metric3: 'metric3Value',
      };
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(
        testMetric,
        MetricUnit.Count,
        10,
        MetricResolution.High
      );
      metrics.addDimensions(additionalDimensions);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(
        3
      );
      expect(loggedData.service).toEqual(defaultServiceName);
      for (const key of Object.keys(additionalDimensions)) {
        expect(loggedData[key]).toEqual(additionalDimensions[key]);
      }
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service', 'metric2', 'metric3']],
              Metrics: [
                {
                  Name: testMetric,
                  StorageResolution: 1,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [testMetric]: 10,
        metric2: 'metric2Value',
        metric3: 'metric3Value',
      });
    });

    test('it should log metadata correctly', () => {
      // Prepare
      const testMetric = 'test-metric';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(testMetric, MetricUnit.Count, 10);
      metrics.addMetadata('foo', 'bar');
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData.foo).toEqual('bar');
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: testMetric,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [testMetric]: 10,
        foo: 'bar',
      });
    });

    test('it should throw error on empty metrics when throwOnEmptyMetrics is true', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.throwOnEmptyMetrics();

      // Assess
      expect(() => metrics.serializeMetrics()).toThrow(
        'The number of metrics recorded must be higher than zero'
      );
    });

    test('it should use the default namespace when no namespace is provided in constructor or found in environment variable', () => {
      // Prepare
      process.env.POWERTOOLS_METRICS_NAMESPACE = '';
      const testMetric = 'test-metric';
      const metrics: Metrics = new Metrics();

      // Act
      metrics.addMetric(testMetric, MetricUnit.Count, 10);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Namespace).toEqual(
        DEFAULT_NAMESPACE
      );
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: testMetric,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: DEFAULT_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [testMetric]: 10,
      });
    });

    test('it should use namespace provided in constructor', () => {
      // Prepare
      const testMetric = 'test-metric';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(testMetric, MetricUnit.Count, 10);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Namespace).toEqual(
        TEST_NAMESPACE
      );
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: testMetric,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [testMetric]: 10,
      });
    });

    test('it should contain a metric value if added once', () => {
      // Prepare
      const metricName = 'test-metric';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(metricName, MetricUnit.Count, 10);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[metricName]).toEqual(10);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: metricName,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [metricName]: 10,
      });
    });

    test('it should convert metric value with the same name and unit to array if added multiple times', () => {
      // Prepare
      const metricName = 'test-metric';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(metricName, MetricUnit.Count, 10);
      metrics.addMetric(metricName, MetricUnit.Count, 20);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[metricName]).toEqual([10, 20]);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: metricName,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [metricName]: [10, 20],
      });
    });

    test('it should create multiple metric values if added multiple times', () => {
      // Prepare
      const metricName1 = 'test-metric-1';
      const metricName2 = 'test-metric-2';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(metricName1, MetricUnit.Count, 10);
      metrics.addMetric(metricName2, MetricUnit.Seconds, 20);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(2);
      expect(loggedData[metricName1]).toEqual(10);
      expect(loggedData[metricName2]).toEqual(20);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: metricName1,
                  Unit: MetricUnit.Count,
                },
                {
                  Name: metricName2,
                  Unit: MetricUnit.Seconds,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [metricName1]: 10,
        [metricName2]: 20,
      });
    });

    test('it should not contain `StorageResolution` as key for non-high resolution metrics', () => {
      // Prepare
      const metricName = 'test-metric';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(metricName, MetricUnit.Count, 10);
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(
        loggedData._aws.CloudWatchMetrics[0].Metrics[0].StorageResolution
      ).toBeUndefined();
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: metricName,
                  Unit: MetricUnit.Count,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [metricName]: 10,
      });
    });

    test('it should contain `StorageResolution` as key & high metric resolution as value for high resolution metrics', () => {
      // Prepare
      const metricName1 = 'test-metric';
      const metricName2 = 'test-metric-2';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.addMetric(metricName1, MetricUnit.Count, 10);
      metrics.addMetric(
        metricName2,
        MetricUnit.Seconds,
        10,
        MetricResolution.High
      );
      const loggedData = metrics.serializeMetrics();

      // Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(2);
      expect(
        loggedData._aws.CloudWatchMetrics[0].Metrics[0].StorageResolution
      ).toBeUndefined();
      expect(
        loggedData._aws.CloudWatchMetrics[0].Metrics[1].StorageResolution
      ).toEqual(MetricResolution.High);
      expect(loggedData).toEqual({
        _aws: {
          CloudWatchMetrics: [
            {
              Dimensions: [['service']],
              Metrics: [
                {
                  Name: metricName1,
                  Unit: MetricUnit.Count,
                },
                {
                  Name: metricName2,
                  StorageResolution: 1,
                  Unit: MetricUnit.Seconds,
                },
              ],
              Namespace: TEST_NAMESPACE,
            },
          ],
          Timestamp: mockDate.getTime(),
        },
        service: 'service_undefined',
        [metricName1]: 10,
        [metricName2]: 10,
      });
    });
  });

  describe('Method: setDefaultDimensions', () => {
    test('it should set default dimensions correctly when service name is provided', () => {
      // Prepare
      const serviceName = 'test-service';
      const metrics: Metrics = new Metrics({ serviceName: serviceName });
      const defaultDimensionsToBeAdded = {
        environment: 'dev',
        foo: 'bar',
      };

      // Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          defaultDimensions: {
            ...defaultDimensionsToBeAdded,
            service: serviceName,
          },
        })
      );
    });

    test('it should set default dimensions correctly when service name is not provided', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const defaultDimensionsToBeAdded = {
        environment: 'dev',
        foo: 'bar',
      };

      // Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          defaultDimensions: {
            ...defaultDimensionsToBeAdded,
            service: 'service_undefined',
          },
        })
      );
    });

    test('it should add default dimensions', () => {
      // Prepare
      const serviceName = 'test-service';
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        serviceName,
        defaultDimensions: { 'test-dimension': 'test-dimension-value' },
      });
      const defaultDimensionsToBeAdded = {
        environment: 'dev',
        foo: 'bar',
      };

      // Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          defaultDimensions: {
            ...defaultDimensionsToBeAdded,
            service: serviceName,
            'test-dimension': 'test-dimension-value',
          },
        })
      );
    });

    test('it should update already added default dimensions values', () => {
      // Prepare
      const serviceName = 'test-service';
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        serviceName,
        defaultDimensions: {
          environment: 'dev',
        },
      });
      const defaultDimensionsToBeAdded = {
        environment: 'prod',
        foo: 'bar',
      };

      // Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          defaultDimensions: {
            foo: 'bar',
            service: serviceName,
            environment: 'prod',
          },
        })
      );
    });

    test('it should throw error if number of default dimensions reaches the maximum allowed', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const defaultDimensions: LooseObject = {};

      // Starts from 1 because the service dimension is already added by default
      for (let i = 1; i < MAX_DIMENSION_COUNT - 1; i++) {
        defaultDimensions[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }

      // Act & Assess
      expect(() =>
        metrics.setDefaultDimensions(defaultDimensions)
      ).not.toThrowError();
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['defaultDimensions']).length).toBe(
        MAX_DIMENSION_COUNT - 1
      );
      expect(() => {
        metrics.setDefaultDimensions({
          'another-dimension': 'another-dimension-value',
        });
      }).toThrowError('Max dimension count hit');
    });

    test('it should consider default dimensions provided in constructor, while throwing error if number of default dimensions reaches the maximum allowed', () => {
      // Prepare
      const initialDefaultDimensions: LooseObject = {
        'test-dimension': 'test-value',
        environment: 'dev',
      };
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        defaultDimensions: initialDefaultDimensions,
      });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const defaultDimensions: LooseObject = {};

      // Starts from 3 because the service dimension is already added by default & two dimensions are already added in the constructor
      for (let i = 3; i < MAX_DIMENSION_COUNT - 1; i++) {
        defaultDimensions[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }

      // Act & Assess
      expect(() =>
        metrics.setDefaultDimensions(defaultDimensions)
      ).not.toThrowError();
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(Object.keys(metrics['defaultDimensions']).length).toBe(
        MAX_DIMENSION_COUNT - 1
      );
      expect(() => {
        metrics.setDefaultDimensions({
          'another-dimension': 'another-dimension-value',
        });
      }).toThrowError('Max dimension count hit');
    });
  });

  describe('Method: setFunctionName', () => {
    test('it should set the function name', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.setFunctionName('test-function');

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          functionName: 'test-function',
        })
      );
    });
  });

  describe('Method: singleMetric', () => {
    test('it should return a single Metric object', () => {
      // Prepare
      const defaultDimensions = {
        foo: 'bar',
        service: 'order',
      };
      const metrics: Metrics = new Metrics({
        namespace: TEST_NAMESPACE,
        defaultDimensions,
        singleMetric: false,
      });

      // Act
      const singleMetric = metrics.singleMetric();

      //Asses
      expect(singleMetric).toEqual(
        expect.objectContaining({
          isSingleMetric: true,
          namespace: TEST_NAMESPACE,
          defaultDimensions,
        })
      );
    });
  });

  describe('Method: throwOnEmptyMetrics', () => {
    test('it should set the throwOnEmptyMetrics flag to true', () => {
      // Prepare
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act
      metrics.throwOnEmptyMetrics();

      // Assess
      expect(metrics).toEqual(
        expect.objectContaining({
          shouldThrowOnEmptyMetrics: true,
        })
      );
    });
  });

  describe('Feature: POWERTOOLS_DEV', () => {
    it('uses the global console object when the environment variable is set', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'true';
      const metrics: Metrics = new Metrics({ namespace: TEST_NAMESPACE });

      // Act & Assess
      // biome-ignore  lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
      expect(metrics['console']).toEqual(console);
    });
  });
});
