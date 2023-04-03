/**
 * Test Metrics helpers
 *
 * @group unit/metrics/all
 */
import { createMetrics, Metrics } from '../../src';
import { ConfigServiceInterface, EnvironmentVariablesService } from '../../src/config';
import { MetricsOptions } from '../../src/types';

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
      
    test('when constructor parameters are set, returns a Metrics instance with the options set in the constructor parameters', () => {

      // Prepare
      const metricsOptions: MetricsOptions = {
        customConfigService: new EnvironmentVariablesService(),
        namespace: 'test-namespace',
        serviceName: 'test-service',
        singleMetric: true,
        defaultDimensions: {
          service: 'order',
        },
      };

      // Act
      const metrics = createMetrics(metricsOptions);

      // Assess
      expect(metrics).toBeInstanceOf(Metrics);
        
      expect(metrics).toEqual(expect.objectContaining({
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
        storedMetrics: {}
      }));
    });
      
    test('when custom namespace is passed, returns a Metrics instance with the correct properties', () => {
            
      // Prepare
      const metricsOptions: MetricsOptions = {
        namespace: 'test-namespace',
      };
    
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
        namespace: metricsOptions.namespace,
        shouldThrowOnEmptyMetrics: false,
        storedMetrics: {}
      }));
    
    });

    test('when custom defaultDimensions is passed, returns a Metrics instance with the correct properties', () => {
              
      // Prepare
      const metricsOptions: MetricsOptions = {
        defaultDimensions: {
          service: 'order',
        },
      };
      
      // Act
      const metrics = createMetrics(metricsOptions);
      
      // Assess
      expect(metrics).toBeInstanceOf(Metrics);
      expect(metrics).toEqual(expect.objectContaining({
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
        storedMetrics: {}
      }));
        
    });

    test('when singleMetric is passed, returns a Metrics instance with the correct properties', () => {
                  
      // Prepare
      const metricsOptions: MetricsOptions = {
        singleMetric: true,
      };
        
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
        isSingleMetric: true,
        metadata: {},
        namespace: 'hello-world',
        shouldThrowOnEmptyMetrics: false,
        storedMetrics: {}
      }));
          
    });

    test('when custom customConfigService is passed, returns a Metrics instance with the correct properties', () => {
                        
      // Prepare
      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getNamespace(): string{
          return 'test-namespace';
        },
        getServiceName(): string{
          return 'test-service';
        }
      };
      const metricsOptions: MetricsOptions = {
        customConfigService: configService,
      };
              
      // Act
      const metrics = createMetrics(metricsOptions);
              
      // Assess
      expect(metrics).toBeInstanceOf(Metrics);
      expect(metrics).toEqual(expect.objectContaining({
        coldStart: true,
        customConfigService: configService,
        defaultDimensions: {
          service: 'test-service'
        },
        defaultServiceName: 'service_undefined',
        dimensions: {},
        envVarsService: expect.any(EnvironmentVariablesService),
        isSingleMetric: false,
        metadata: {},
        namespace: 'test-namespace',
        shouldThrowOnEmptyMetrics: false,
        storedMetrics: {}
      }));
                
    });

    test('when custom serviceName is passed, returns a Metrics instance with the correct properties', () => {
                            
      // Prepare
      const metricsOptions: MetricsOptions = {
        serviceName: 'test-service',
      };
                      
      // Act
      const metrics = createMetrics(metricsOptions);
                      
      // Assess
      expect(metrics).toBeInstanceOf(Metrics);
      expect(metrics).toEqual(expect.objectContaining({
        coldStart: true,
        customConfigService: undefined,
        defaultDimensions: {
          service: 'test-service'
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

  });

});