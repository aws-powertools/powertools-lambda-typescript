/**
 * Test Metrics helpers
 *
 * @group unit/metrics/all
 */
import { createMetrics, Metrics } from '../../src';
import { EnvironmentVariablesService } from '../../src/config';

describe('Helper: createMetrics function', () => {

  const ENVIRONMENT_VARIABLES = process.env; 

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('MetricsOptions constructor parameters', () => {

    test('when no constructor parameters are set, returns a Metrics instance with the options set in the environment variables', () => {

      // Prepare
      const metricsOptions = undefined;

      // Act
      const metrics = createMetrics(metricsOptions);

      // Assess
      expect(metrics).toBeInstanceOf(Metrics);
      expect(metrics).toEqual(expect.objectContaining({
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
        storedMetrics: {}
      }));

    });
      
    test('when no constructor parameters and no environment variables are set, returns a Metrics instance with the default properties', () => {

      // Prepare
      const metricsOptions = undefined;
      process.env = {};

      // Act
      const metrics = createMetrics(metricsOptions);

      // Assess
      expect(metrics).toBeInstanceOf(Metrics);
      expect(metrics).toEqual(expect.objectContaining({
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
        storedMetrics: {}
      }));

    });

  });

});