/**
 * Test Metrics class
 *
 * @group unit/metrics/class
 */

import {
  LambdaInterface,
  ContextExamples as dummyContext,
  Events as dummyEvent
} from '@aws-lambda-powertools/commons';
import { MetricResolution, MetricUnits, Metrics, createMetrics } from '../../src/';
import { Context } from 'aws-lambda';
import { Dimensions, EmfOutput } from '../../src/types';
import { DEFAULT_NAMESPACE, MAX_DIMENSION_COUNT, MAX_METRICS_SIZE } from '../../src/constants';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

describe('Class: Metrics', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext.helloworldContext;
  const event = dummyEvent.Custom.CustomEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  beforeAll(() => {
    dateSpy.mockClear();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  describe('Method: addMetric', () => {
    
    test('when called, it should store metrics', () => {
      
      //Prepare
      const metrics = new Metrics();
      const metricName = 'test_metric';

      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 1, MetricResolution.High);

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          [metricName]: {
            name: metricName,
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 1
          }
        },
      }));
    });

    test('when called with multiple metric name, it should store multiple metrics', () => {
      
      //Prepare
      const metrics = new Metrics();

      //Act
      metrics.addMetric('test_metric-1', MetricUnits.Count, 1, MetricResolution.High);
      metrics.addMetric('test_metric-2', MetricUnits.Count, 3, MetricResolution.High);
      metrics.addMetric('test_metric-3', MetricUnits.Count, 6, MetricResolution.High);

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          'test_metric-1': {
            name: 'test_metric-1',
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 1
          },
          'test_metric-2': {
            name: 'test_metric-2',
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 3
          },
          'test_metric-3': {
            name: 'test_metric-3',
            resolution: MetricResolution.High,
            unit: MetricUnits.Count,
            value: 6
          }
        },
      }));
    });

    test('when called without resolution, it should store metrics with standard resolution', () => {
   
      //Prepare
      const metrics = new Metrics();

      //Act
      metrics.addMetric('test-metric-1', MetricUnits.Count, 1);
      metrics.addMetric('test-metric-2', MetricUnits.Seconds, 3);

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          'test-metric-1': {
            name: 'test-metric-1',
            resolution: MetricResolution.Standard,
            unit: MetricUnits.Count,
            value: 1
          },
          'test-metric-2': {
            name: 'test-metric-2',
            resolution: MetricResolution.Standard,
            unit: MetricUnits.Seconds,
            value: 3
          }
        },
      }));
    });

    test('when trying to add metric with the same name multiple times, values should be grouped together in an array', () => {

      //Prepare
      const metrics = new Metrics();
      const metricName = 'test-metric';

      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 1);
      metrics.addMetric(metricName, MetricUnits.Count, 5);
      metrics.addMetric(metricName, MetricUnits.Count, 1);
      metrics.addMetric(metricName, MetricUnits.Count, 4);
      
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {
          [metricName]: {
            name: metricName,
            resolution: MetricResolution.Standard,
            unit: MetricUnits.Count,
            value: [ 1, 5, 1, 4 ]
          }
        },
      }));
    });

    test('when trying to add metric with the same name multiple times but with different unit, it will throw an error', () => {

      //Prepare
      const metrics = new Metrics();
      const metricName = 'test-metric';

      // Act & Assess
      expect(() => {
        metrics.addMetric(metricName, MetricUnits.Count, 1);
        metrics.addMetric(metricName, MetricUnits.Kilobits, 5);
      }).toThrowError(Error);

    });

    test('it will publish metrics if stored metrics count has reached max metric size threshold', () => {
        
      //Prepare
      const metrics = new Metrics();
      const publishStoredMetricsSpy = jest.spyOn(metrics, 'publishStoredMetrics');
      const metricName = 'test-metric';
        
      //Act
      for (let i = 0; i <= MAX_METRICS_SIZE; i++) {
        metrics.addMetric(`${metricName}-${i}`, MetricUnits.Count, i);
      }
  
      // Assess
      expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(1);

    });

    test('it will not publish metrics if stored metrics count has not reached max metric size threshold', () => {
        
      //Prepare
      const metrics = new Metrics();
      const publishStoredMetricsSpy = jest.spyOn(metrics, 'publishStoredMetrics');
      const metricName = 'test-metric';
        
      //Act
      for (let i = 0; i < MAX_METRICS_SIZE; i++) {
        metrics.addMetric(`${metricName}-${i}`, MetricUnits.Count, i);
      }
  
      // Assess
      expect(publishStoredMetricsSpy).toHaveBeenCalledTimes(0);

    });
  });

  describe('Method: clearMetrics', () => {
      
    test('when called, it should clear stored metrics', () => {
          
      //Prepare
      const metrics = new Metrics();
      const metricName = 'test-metric';
          
      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 1);
      metrics.clearMetrics();
    
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        storedMetrics: {},
      }));
        
    });
    
  });

  describe('Method: addDimension', () => {
    
    test('when called, it should store dimensions', () => {
        
      //Prepare
      const metrics = new Metrics();
      const dimensionName = 'test-dimension';
      const dimensionValue= 'test-value';
  
      //Act
      metrics.addDimension(dimensionName, dimensionValue);
  
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        dimensions: {
          [dimensionName]: dimensionValue
        },
      }));
      
    });

    test('it should throw error if number of dimensions exceeds the maximum allowed', () => {
        
      //Prepare
      const metrics = new Metrics();
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
  
      // Act & Assess
      expect(() => {
        for (let i = 0; i < MAX_DIMENSION_COUNT; i++) {
          metrics.addDimension(`${dimensionName}-${i}`, `${dimensionValue}-${i}`);
        }
      }).toThrowError(RangeError);
      
    });

    test('it should take consideration of defaultDimensions while throwing error if number of dimensions exceeds the maximum allowed', () => {
        
      //Prepare
      const metrics = new Metrics({ defaultDimensions: { 'environment': 'prod', 'foo': 'bar' } });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
  
      // Act & Assess
      expect(() => {
        for (let i = 0; i < 27; i++) {
          metrics.addDimension(`${dimensionName}-${i}`, `${dimensionValue}-${i}`);
        }
      }).toThrowError(RangeError);

    });

  });

  describe('Method: addDimensions', () => {
      
    test('it should add multiple dimensions', () => {
      
      //Prepare
      const dimensionsToBeAdded: { [key: string]: string } = {
        'test-dimension-1': 'test-value-1',
        'test-dimension-2': 'test-value-2',
      };
      const metrics = new Metrics();

      //Act
      metrics.addDimensions(dimensionsToBeAdded);

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        dimensions: dimensionsToBeAdded
      }));

    });

    test('if same dimension is added again, it should update existing dimension value', () => {
      
      //Prepare
      const dimensionsToBeAdded: { [key: string]: string } = {
        'test-dimension-1': 'test-value-1',
        'test-dimension-2': 'test-value-2',
      };
      const metrics = new Metrics();

      //Act
      metrics.addDimensions(dimensionsToBeAdded);
      metrics.addDimensions({ 'test-dimension-1': 'test-value-3' });

      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        dimensions: {
          'test-dimension-1': 'test-value-3',
          'test-dimension-2': 'test-value-2',
        }
      }));

    });

    test('it should throw error if number of dimensions exceeds the maximum allowed', () => {
        
      //Prepare
      const metrics = new Metrics();
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const dimensionsToBeAdded: { [key: string]: string } = {};
      for (let i = 0; i <= MAX_DIMENSION_COUNT; i++) {
        dimensionsToBeAdded[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }
     
      // Act & Assess
      expect(() => {
        metrics.addDimensions(dimensionsToBeAdded);
      }).toThrowError(RangeError);
      
    });

    test('it should successfully add up to maximum allowed dimensions without throwing error', () => {
        
      //Prepare
      const metrics = new Metrics();
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const dimensionsToBeAdded: { [key: string]: string } = {};
      for (let i = 0; i < MAX_DIMENSION_COUNT; i++) {
        dimensionsToBeAdded[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }
     
      // Act & Assess
      expect(() => {
        metrics.addDimensions(dimensionsToBeAdded);
      }).not.toThrowError(RangeError);
      expect(metrics).toEqual(expect.objectContaining({ dimensions: dimensionsToBeAdded }));
      
    });
    
  });

  describe('Method: setDefaultDimensions', () => {
        
    test('it should set default dimensions when service name is not provided', () => {
          
      //Prepare
      const defaultDimensionsToBeAdded = {
        'environment': 'prod',
        'foo': 'bar',
      };
      const metrics = new Metrics();
    
      //Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);
    
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        defaultDimensions: { ...defaultDimensionsToBeAdded, service : 'service_undefined' }
      }));
        
    });

    test('it should set default dimensions when service name is provided', () => {
          
      //Prepare
      const defaultDimensionsToBeAdded = {
        'environment': 'prod',
        'foo': 'bar',
      };
      const serviceName = 'test-service';
      const metrics = new Metrics({ serviceName: serviceName });
    
      //Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);
    
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        defaultDimensions: { ...defaultDimensionsToBeAdded, service : serviceName }
      }));
        
    });

    test('it should add default dimensions', () => {
          
      //Prepare
      const defaultDimensionsToBeAdded = {
        'environment': 'prod',
        'foo': 'bar',
      };
      const serviceName = 'test-service';
      const metrics = new Metrics({ serviceName: serviceName , defaultDimensions: { 'test-dimension': 'test-dimension-value' } });
    
      //Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);
    
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        defaultDimensions: { ...defaultDimensionsToBeAdded, service : serviceName , 'test-dimension': 'test-dimension-value' }
      }));
        
    });

    test('it should update already added default dimensions values', () => {
          
      //Prepare
      const defaultDimensionsToBeAdded = {
        'environment': 'prod',
        'foo': 'bar',
      };
      const serviceName = 'test-service';
      const metrics = new Metrics({ serviceName: serviceName, defaultDimensions: { 'environment': 'dev' } });
    
      //Act
      metrics.setDefaultDimensions(defaultDimensionsToBeAdded);
    
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        defaultDimensions: { foo: 'bar', service: serviceName, 'environment': 'prod' }
      }));

    });

    test('it should throw error if number of dimensions reaches the maximum allowed', () => {
          
      //Prepare
      const metrics = new Metrics();
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const defaultDimensions: { [key: string]: string } = {};
      for (let i = 0; i <= MAX_DIMENSION_COUNT; i++) {
        defaultDimensions[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }
      
      // Act & Assess
      expect(() => {
        metrics.setDefaultDimensions(defaultDimensions);
      }).toThrowError(Error);
        
    });

    test('it should consider default dimensions provided in constructor, while throwing error if number of dimensions exceeds the maximum allowed', () => {
          
      //Prepare
      const metrics = new Metrics({
        defaultDimensions: {
          'test-dimension': 'test-value',
          'environment': 'dev'
        }
      });
      const dimensionName = 'test-dimension';
      const dimensionValue = 'test-value';
      const defaultDimensions: { [key: string]: string } = {};
      for (let i = 0; i < 27; i++) {
        defaultDimensions[`${dimensionName}-${i}`] = `${dimensionValue}-${i}`;
      }
      
      // Act & Assess
      expect(() => {
        metrics.setDefaultDimensions(defaultDimensions);
      }).toThrowError(Error);
        
    });
    
  });

  describe('Method: clearDefaultDimensions', () => {
      
    test('it should clear all default dimensions', () => {
          
      //Prepare
      const metrics = new Metrics();
      metrics.setDefaultDimensions({ 'foo': 'bar' });
    
      //Act
      metrics.clearDefaultDimensions();
    
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        defaultDimensions: {}
      }));
        
    });
  }); 

  describe('Method: addMetadata', () => {

    test('it should add metadata', () => {
        
      //Prepare
      const metrics = new Metrics();
  
      //Act
      metrics.addMetadata('foo', 'bar');
  
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        metadata: { 'foo': 'bar' }
      }));
      
    });

    test('it should update metadata value if added again', () => {
        
      //Prepare
      const metrics = new Metrics();
  
      //Act
      metrics.addMetadata('foo', 'bar');
      metrics.addMetadata('foo', 'baz');
  
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        metadata: { 'foo': 'baz' }
      }));
      
    });
  });

  describe('Method: clearDimensions', () => {
    
    test('it should clear all dimensions', () => {
        
      //Prepare
      const metrics = new Metrics();
      metrics.addDimension('foo', 'bar');
  
      //Act
      metrics.clearDimensions();
  
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        dimensions: {}
      }));
      
    });

    test('it should not clear default dimensions', () => {
        
      //Prepare
      const metrics = new Metrics({ defaultDimensions: { 'environment': 'prod' } });
      metrics.addDimension('foo', 'bar');
  
      //Act
      metrics.clearDimensions();
  
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        dimensions: {},
        defaultDimensions: {
          'environment': 'prod',
          'service': 'service_undefined'
        }
      }));
      
    });

  });

  describe('Method: clearMetadata', () => {
    
    test('it should clear all metadata', () => {
        
      //Prepare
      const metrics = new Metrics();
      metrics.addMetadata('foo', 'bar');
      metrics.addMetadata('test', 'baz');
  
      //Act
      metrics.clearMetadata();
  
      // Assess
      expect(metrics).toEqual(expect.objectContaining({
        metadata: {}
      }));
      
    });

  });

  describe('Method: singleMetric', () => {

    test('it should return a single Metric object', () => {

      //Prepare
      const namespace = 'test-namespace';
      const defaultDimensions = {
        'foo': 'bar',
        'service': 'order'
      };
      const metrics = new Metrics({
        namespace,
        defaultDimensions,
        singleMetric: false
      });

      //Act
      const singleMetric = metrics.singleMetric();
      
      //Asses
      expect(singleMetric).toEqual(expect.objectContaining({
        isSingleMetric: true,
        namespace,
        defaultDimensions
      }));

    });

  });

  describe('Method: throwOnEmptyMetrics', () => {
      
    test('it should set the throwOnEmptyMetrics flag to true', () => {
  
      //Prepare
      const metrics = new Metrics();
  
      //Act
      metrics.throwOnEmptyMetrics();

      //Assess
      expect(metrics).toEqual(expect.objectContaining({
        shouldThrowOnEmptyMetrics: true
      }));
  
    });
  
  });

  describe('Method: setFunctionName', () => {
      
    test('it should set the function name', () => {
  
      //Prepare
      const metrics = new Metrics();
  
      //Act
      metrics.setFunctionName('test-function');

      //Assess
      expect(metrics).toEqual(expect.objectContaining({
        functionName: 'test-function'
      }));
  
    });
  
  });

  describe('Method: logMetrics', () => {

    const expectedReturnValue = 'Lambda invoked!';
    const testMetric = 'successfulBooking';

    test('it should log metrics', async () => {

      //Prepare
      const metrics = new Metrics();
      const publishStoredMetricsSpy = jest.spyOn(metrics, 'publishStoredMetrics');
      const addMetricSpy = jest.spyOn(metrics, 'addMetric');
      const captureColdStartMetricSpy = jest.spyOn(metrics, 'captureColdStartMetric');
      class LambdaFunction implements LambdaInterface {

        @metrics.logMetrics()
        public async handler<TEvent>(_event: TEvent, _context: Context): Promise<string> {
          metrics.addMetric(testMetric, MetricUnits.Count, 1);
          
          return expectedReturnValue;
        }

      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      const actualResult = await handler(event, context);

      // Assess
      expect(actualResult).toEqual(expectedReturnValue);
      expect(captureColdStartMetricSpy).not.toBeCalled();
      expect(addMetricSpy).toHaveBeenNthCalledWith(1, testMetric, MetricUnits.Count, 1);
      expect(publishStoredMetricsSpy).toBeCalledTimes(1);

    });

    test('it should capture cold start metrics, if passed in the options as true', async () => {
      
      //Prepare
      const metrics = new Metrics();
      const publishStoredMetricsSpy = jest.spyOn(metrics, 'publishStoredMetrics');
      const addMetricSpy = jest.spyOn(metrics, 'addMetric');
      const captureColdStartMetricSpy = jest.spyOn(metrics, 'captureColdStartMetric');
      class LambdaFunction implements LambdaInterface {

        @metrics.logMetrics({ captureColdStartMetric: true })
        public async handler<TEvent>(_event: TEvent, _context: Context): Promise<string> {
          metrics.addMetric(testMetric, MetricUnits.Count, 1);
          
          return expectedReturnValue;
        }

      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      const actualResult = await handler(event, context);

      // Assess
      expect(actualResult).toEqual(expectedReturnValue);
      expect(captureColdStartMetricSpy).toBeCalledTimes(1);
      expect(addMetricSpy).toHaveBeenNthCalledWith(1, testMetric, MetricUnits.Count, 1);
      expect(publishStoredMetricsSpy).toBeCalledTimes(1);

    });

    test('it should throw error if no metrics are added and throwOnEmptyMetrics is set to true', async () => {
        
      //Prepare
      const metrics = new Metrics();
      class LambdaFunction implements LambdaInterface {
  
        @metrics.logMetrics({ throwOnEmptyMetrics: true })
        public async handler<TEvent>(_event: TEvent, _context: Context): Promise<string> {
          return expectedReturnValue;
        }
  
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);
  
      // Act & Assess
      await expect(handler(event, context)).rejects.toThrowError(RangeError);
  
    });

    test('it should set default dimensions if passed in the options', async () => {
          
      //Prepare
      const defaultDimensions = {
        'foo': 'bar',
        'service': 'order'
      };
      const metrics = new Metrics();
      const setDefaultDimensionsSpy = jest.spyOn(metrics, 'setDefaultDimensions');
      const publishStoredMetricsSpy = jest.spyOn(metrics, 'publishStoredMetrics');
      const addMetricSpy = jest.spyOn(metrics, 'addMetric');

      class LambdaFunction implements LambdaInterface {
    
        @metrics.logMetrics({ defaultDimensions })
        public async handler<TEvent>(_event: TEvent, _context: Context): Promise<string> {
          metrics.addMetric(testMetric, MetricUnits.Count, 1);
          
          return expectedReturnValue;
        }
    
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);
    
      // Act
      await handler(event, context);
    
      // Assess
      expect(setDefaultDimensionsSpy).toHaveBeenNthCalledWith(1, defaultDimensions);
      expect(addMetricSpy).toHaveBeenNthCalledWith(1, testMetric, MetricUnits.Count, 1);
      expect(publishStoredMetricsSpy).toBeCalledTimes(1);
    
    });

    test('it should throw error if lambda handler throws any error', async () => {
          
      //Prepare
      const metrics = new Metrics();
      const errorMessage = 'Unexpected error occurred!';
      class LambdaFunction implements LambdaInterface {
    
        @metrics.logMetrics()
        public async handler<TEvent>(_event: TEvent, _context: Context): Promise<string> {
          throw new Error(errorMessage);
        }
    
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);
    
      // Act & Assess
      await expect(handler(event, context)).rejects.toThrowError(errorMessage);
    
    });

  });

  describe('Method: serializeMetrics', () => {

    const defaultServiceName = 'service_undefined';

    test('it should print warning, if no namespace provided in constructor or environment variable', () => {

      //Prepare
      process.env.POWERTOOLS_METRICS_NAMESPACE = '';
      const metrics = new Metrics();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      //Act
      metrics.serializeMetrics();

      //Assess
      expect(consoleWarnSpy).toBeCalledWith('Namespace should be defined, default used');

    });

    test('it should return right object compliant with Cloudwatch EMF', () => {
      
      //Prepare
      const metrics: Metrics = createMetrics({
        namespace: 'test-namespace',
        serviceName: 'test-service',
        defaultDimensions: {
          'environment': 'dev'
        }
      });

      //Act
      metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      metrics.addMetric('successfulBooking', MetricUnits.Count, 3);
      metrics.addMetric('failedBooking', MetricUnits.Count, 1, MetricResolution.High);
      const loggedData = metrics.serializeMetrics();

      //Assess
      expect(loggedData).toEqual(
        {
          '_aws': {
            'Timestamp': mockDate.getTime(),
            'CloudWatchMetrics': [
              {
                'Namespace': 'test-namespace',
                'Dimensions': [
                  [
                    'service',
                    'environment'
                  ]
                ],
                'Metrics': [
                  {
                    'Name': 'successfulBooking',
                    'Unit': 'Count'
                  },
                  {
                    'Name': 'failedBooking',
                    'Unit': 'Count',
                    'StorageResolution': 1
                  }
                ]
              }
            ]
          },
          'environment': 'dev',
          'service': 'test-service',
          'successfulBooking': [ 1, 3 ],
          'failedBooking': 1
        }
      );
    });

    test('it should log service dimension correctly when passed', () => { 

      //Prepare
      const serviceName = 'test-service';
      const metrics: Metrics = createMetrics({ serviceName:serviceName });

      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const loggedData = metrics.serializeMetrics();

      //Assess
      expect(loggedData.service).toEqual(serviceName);

    });

    test('it should log service dimension correctly from env var when not passed', () => {

      //Prepare
      const serviceName = 'hello-world-service';
      process.env.POWERTOOLS_SERVICE_NAME = serviceName;
      const metrics: Metrics = createMetrics();

      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const loggedData = metrics.serializeMetrics();

      //Assess
      expect(loggedData.service).toEqual(serviceName);
      delete process.env.POWERTOOLS_SERVICE_NAME;
      
    });

    test('it should log default dimensions correctly', () => {
        
      //Prepare
      const additionalDimensions = {
        'foo': 'bar',
        'env': 'dev'
      };
      const metrics: Metrics = createMetrics({ defaultDimensions: additionalDimensions });
  
      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const loggedData = metrics.serializeMetrics();
  
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(3);
      expect(loggedData.service).toEqual(defaultServiceName);
      expect(loggedData.foo).toEqual(additionalDimensions.foo);
      expect(loggedData.env).toEqual(additionalDimensions.env);
  
    });

    test('it should log additional dimensions correctly', () => {
          
      //Prepare
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };
      const metrics: Metrics = createMetrics();
    
      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10, MetricResolution.High);
      metrics.addDimension(additionalDimension.name, additionalDimension.value);
      const loggedData = metrics.serializeMetrics();
    
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(2);
      expect(loggedData.service).toEqual(defaultServiceName);
      expect(loggedData[additionalDimension.name]).toEqual(additionalDimension.value);
    
    });

    test('it should log additional bulk dimensions correctly', () => {
          
      //Prepare
      const additionalDimensions: { [key: string]: string } = {
        metric2: 'metric2Value',
        metric3: 'metric3Value'
      };
      const metrics: Metrics = createMetrics();
    
      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10, MetricResolution.High);
      metrics.addDimensions(additionalDimensions);
      const loggedData = metrics.serializeMetrics();
    
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(3);
      expect(loggedData.service).toEqual(defaultServiceName);
      Object.keys(additionalDimensions).forEach((key) => {
        expect(loggedData[key]).toEqual(additionalDimensions[key]);
      });
    
    });

    test('it should log metadata correctly', () => {
            
      //Prepare
      const metrics: Metrics = createMetrics();
      
      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      metrics.addMetadata('foo', 'bar');
      const loggedData = metrics.serializeMetrics();
      
      //Assess
      expect(loggedData.foo).toEqual('bar');
      
    });

    test('it should throw error on empty metrics when throwOnEmptyMetrics is true', () => {
                
      //Prepare
      const metrics: Metrics = createMetrics();
        
      //Act
      metrics.throwOnEmptyMetrics();

      //Assess
      expect(() => metrics.serializeMetrics()).toThrow('The number of metrics recorded must be higher than zero');
          
    });

    test('it should use default namespace when not provided', () => {
                  
      //Prepare
      const metrics: Metrics = createMetrics();
          
      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const loggedData = metrics.serializeMetrics();
          
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Namespace).toEqual(DEFAULT_NAMESPACE);
          
    });

    test('it should use namespace provided in constructor', () => {
                      
      //Prepare
      const namespace = 'test-namespace';
      const metrics: Metrics = createMetrics({ namespace: namespace });
              
      //Act
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const loggedData = metrics.serializeMetrics();
              
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Namespace).toEqual(namespace);  
      
    });

    test('it should contain a metric value if added once', () => {
                            
      //Prepare
      const metricName = 'test-metrics';
      const metrics: Metrics = createMetrics();
                    
      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 10);
      const loggedData = metrics.serializeMetrics();
                    
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData['test-metrics']).toEqual(10);
          
    });

    test('it should convert metric value with the same name and unit to array if added multiple times', () => {
                              
      //Prepare
      const metricName = 'test-metrics';
      const metrics: Metrics = createMetrics();
                      
      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 10);
      metrics.addMetric(metricName, MetricUnits.Count, 20);
      const loggedData = metrics.serializeMetrics();
                      
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[metricName]).toEqual([ 10, 20 ]);
            
    });

    test('it should create multiple metric values if added multiple times', () => {
                                  
      //Prepare
      const metricName1 = 'test-metrics';
      const metricName2 = 'test-metrics-2';
      const metrics: Metrics = createMetrics();
                          
      //Act
      metrics.addMetric(metricName1, MetricUnits.Count, 10);
      metrics.addMetric(metricName2, MetricUnits.Seconds, 20);
      const loggedData = metrics.serializeMetrics();
                          
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(2);
      expect(loggedData[metricName1]).toEqual(10);
      expect(loggedData[metricName2]).toEqual(20);
              
    });

    test('it should not contain `StorageResolution` as key for non-high resolution metrics', () => {
                                        
      //Prepare
      const metricName = 'test-metrics';
      const metrics: Metrics = createMetrics();
                                
      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 10);
      const loggedData = metrics.serializeMetrics();
                                
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].StorageResolution).toBeUndefined();  

    });

    test('it should contain `StorageResolution` as key & high metric resolution as value for high resolution metrics', () => {
                                        
      //Prepare
      const metricName = 'test-metrics';
      const metricName2 = 'test-metrics-2';
      const metrics: Metrics = createMetrics();
                                
      //Act
      metrics.addMetric(metricName, MetricUnits.Count, 10);
      metrics.addMetric(metricName2, MetricUnits.Seconds, 10, MetricResolution.High);
      const loggedData = metrics.serializeMetrics();
                                
      //Assess
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(2);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].StorageResolution).toBeUndefined();
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[1].StorageResolution).toEqual(MetricResolution.High);  
      
    });

  });

  describe('Methods: publishStoredMetrics', () => {
    
    test('it should console warning if no metrics are added', () => {
        
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act 
      metrics.publishStoredMetrics();

      // Assess
      expect(consoleWarnSpy).toBeCalledTimes(1);
      expect(consoleWarnSpy).toBeCalledWith(
        'No application metrics to publish. The cold-start metric may be published if enabled. If application metrics should never be empty, consider using \'throwOnEmptyMetrics\'',
      );
        
    });

    test('it should call serializeMetrics && log the stringified return value of serializeMetrics', () => {
            
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockData: EmfOutput = {
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [
            {
              'Namespace': 'test',
              'Dimensions': [
                [
                  'service'
                ]
              ],
              'Metrics': [
                {
                  'Name': 'test-metrics',
                  'Unit': MetricUnits.Count
                }
              ]
            }
          ]
        },
        'service': 'service_undefined',
        'test-metrics': 10
      };
      const serializeMetricsSpy = jest.spyOn(metrics, 'serializeMetrics').mockImplementation(() => mockData);
  
      // Act 
      metrics.publishStoredMetrics();
  
      // Assess
      expect(serializeMetricsSpy).toBeCalledTimes(1);
      expect(consoleLogSpy).toBeCalledTimes(1);
      expect(consoleLogSpy).toBeCalledWith(JSON.stringify(mockData));
            
    });

    test('it should call clearMetrics function', () => {
                  
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const clearMetricsSpy = jest.spyOn(metrics, 'clearMetrics');
    
      // Act 
      metrics.publishStoredMetrics();
    
      // Assess
      expect(clearMetricsSpy).toBeCalledTimes(1);
              
    });

    test('it should call clearDimensions function', () => {
                      
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const clearDimensionsSpy = jest.spyOn(metrics, 'clearDimensions');
        
      // Act 
      metrics.publishStoredMetrics();
        
      // Assess
      expect(clearDimensionsSpy).toBeCalledTimes(1);
                  
    });

    test('it should call clearMetadata function', () => {
                            
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      metrics.addMetric('test-metrics', MetricUnits.Count, 10);
      const clearMetadataSpy = jest.spyOn(metrics, 'clearMetadata');
              
      // Act 
      metrics.publishStoredMetrics();
              
      // Assess
      expect(clearMetadataSpy).toBeCalledTimes(1);
                        
    });

  });

  describe('Methods: captureColdStartMetric', () => {
      
    test('it should call addMetric with correct parameters', () => {
            
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      const singleMetricMock: Metrics = createMetrics({ namespace: 'test', singleMetric: true });
      const singleMetricSpy = jest.spyOn(metrics, 'singleMetric').mockImplementation(() => singleMetricMock);
      const addMetricSpy = jest.spyOn(singleMetricMock, 'addMetric');
    
      // Act 
      metrics.captureColdStartMetric();
    
      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(addMetricSpy).toBeCalledTimes(1);
      expect(addMetricSpy).toBeCalledWith('ColdStart', MetricUnits.Count, 1);
              
    });

    test('it should call setDefaultDimensions with correct parameters', () => {
                
      // Prepare
      const defaultDimensions: Dimensions = {
        'foo': 'bar',
        'service': 'order'
      };
      const metrics: Metrics = createMetrics({
        namespace: 'test',
        defaultDimensions
      });
      const singleMetricMock: Metrics = createMetrics({ namespace: 'test', singleMetric: true });
      const singleMetricSpy = jest.spyOn(metrics, 'singleMetric').mockImplementation(() => singleMetricMock);
      const setDefaultDimensionsSpy = jest.spyOn(singleMetricMock, 'setDefaultDimensions');
        
      // Act 
      metrics.captureColdStartMetric();
        
      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledWith({ service: defaultDimensions.service });
                  
    });

    test('it should call setDefaultDimensions with correct parameters if not set', () => {
                
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      const singleMetricMock: Metrics = createMetrics({ namespace: 'test', singleMetric: true });
      const singleMetricSpy = jest.spyOn(metrics, 'singleMetric').mockImplementation(() => singleMetricMock);
      const setDefaultDimensionsSpy = jest.spyOn(singleMetricMock, 'setDefaultDimensions');
        
      // Act 
      metrics.captureColdStartMetric();
        
      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledTimes(1);
      expect(setDefaultDimensionsSpy).toBeCalledWith({ service: 'service_undefined' });
                  
    });

    test('it should call addDimension, if functionName is set', () => {
                  
      // Prepare
      const functionName = 'cold-start';
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      metrics.setFunctionName(functionName);
      const singleMetricMock: Metrics = createMetrics({ namespace: 'test', singleMetric: true });
      const singleMetricSpy = jest.spyOn(metrics, 'singleMetric').mockImplementation(() => singleMetricMock);
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
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      const singleMetricMock: Metrics = createMetrics({ namespace: 'test', singleMetric: true });
      const singleMetricSpy = jest.spyOn(metrics, 'singleMetric').mockImplementation(() => singleMetricMock);
      const addDimensionSpy = jest.spyOn(singleMetricMock, 'addDimension');
          
      // Act 
      metrics.captureColdStartMetric();
          
      // Assess
      expect(singleMetricSpy).toBeCalledTimes(1);
      expect(addDimensionSpy).toBeCalledTimes(0);
                      
    });

    test('it should not call any function, if there is no cold start', () => {
                    
      // Prepare
      const metrics: Metrics = createMetrics({ namespace: 'test' });
      jest.spyOn(metrics, 'isColdStart').mockImplementation(() => false);

      const singleMetricMock: Metrics = createMetrics({ namespace: 'test', singleMetric: true });
      const singleMetricSpy = jest.spyOn(metrics, 'singleMetric').mockImplementation(() => singleMetricMock);
      const addMetricSpy = jest.spyOn(singleMetricMock, 'addMetric');
      const setDefaultDimensionsSpy = jest.spyOn(singleMetricMock, 'setDefaultDimensions');
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
});
