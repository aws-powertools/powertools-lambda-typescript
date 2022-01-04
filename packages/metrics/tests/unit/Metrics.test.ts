/**
 * Test Metrics class
 *
 * @group unit/metrics/class
 */

import { ContextExamples as dummyContext, LambdaInterface } from '@aws-lambda-powertools/commons';
import { Context, Callback } from 'aws-lambda';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { Metrics, MetricUnits } from '../../src/';
import { populateEnvironmentVariables } from '../helpers';

const MAX_METRICS_SIZE = 100;
const MAX_DIMENSION_COUNT = 9;
const DEFAULT_NAMESPACE = 'default_namespace';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

interface LooseObject {
  [key: string]: string
}

type DummyEvent = {
  key1: string
  key2: string
  key3: string
};

describe('Class: Metrics', () => {
  const originalEnvironmentVariables = process.env;

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  beforeAll(() => {
    populateEnvironmentVariables();
  });

  afterEach(() => {
    process.env = originalEnvironmentVariables;
    delete process.env.POWERTOOLS_SERVICE_NAME;
  });

  describe('Feature: Dimensions logging', () => {
    test('should log service dimension correctly when passed', () => {
      const serviceName = 'testing_name';

      const metrics = new Metrics({ namespace: 'test', service: serviceName });
      metrics.addMetric('test_name', MetricUnits.Seconds, 14);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData.service).toEqual(serviceName);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0][0]).toEqual('service');
    });

    test('should log service dimension correctly from env var when not passed', () => {
      const serviceName = 'hello-world-service';
      process.env.POWERTOOLS_SERVICE_NAME = serviceName;

      const metrics = new Metrics({ namespace: 'test' });
      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData.service).toEqual(serviceName);
    });

    test('Additional dimensions should be added correctly', () => {
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };
      const metrics = new Metrics({ namespace: 'test' });

      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      metrics.addDimension(additionalDimension.name, additionalDimension.value);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData[additionalDimension.name]).toEqual(additionalDimension.value);
    });

    test('Adding more than max dimensions should throw error', () => {
      expect.assertions(1);
      const metrics = new Metrics();
      for (let x = 0; x < MAX_DIMENSION_COUNT; x++) {
        metrics.addDimension(`Dimension-${x}`, `value-${x}`);
      }
      try {
        metrics.addDimension(`Dimension-${MAX_DIMENSION_COUNT}`, `value-${MAX_DIMENSION_COUNT}`);
      } catch (e) {
        expect((<Error>e).message).toBe(`The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`);
      }
    });

    test('Additional bulk dimensions should be added correctly', () => {
      const additionalDimensions: LooseObject = { dimension2: 'dimension2Value', dimension3: 'dimension3Value' };
      const metrics = new Metrics({ namespace: 'test' });

      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      metrics.addDimensions(additionalDimensions);
      const loggedData = metrics.serializeMetrics();

      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(2);
      Object.keys(additionalDimensions).forEach((key) => {
        expect(loggedData[key]).toEqual(additionalDimensions[key]);
      });
    });

    test('Bulk Adding more than max dimensions should throw error', () => {
      expect.assertions(1);
      const metrics = new Metrics();
      const additionalDimensions: LooseObject = {};

      metrics.addDimension('Dimension-Initial', 'Dimension-InitialValue');
      for (let x = 0; x < MAX_DIMENSION_COUNT; x++) {
        additionalDimensions[`dimension${x}`] = `dimension${x}Value`;
      }

      try {
        metrics.addDimensions(additionalDimensions);
      } catch (e) {
        expect((<Error>e).message).toBe(
          `Unable to add ${
            Object.keys(additionalDimensions).length
          } dimensions: the number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`,
        );
      }
    });
  });

  describe('Feature: Metadata', () => {
    test('Metadata should be added correctly', () => {
      const metadataItem = { name: 'metaName', value: 'metaValue' };

      const metrics = new Metrics({ namespace: 'test' });
      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      metrics.addMetadata(metadataItem.name, metadataItem.value);

      const loggedData = metrics.serializeMetrics();
      metrics.clearMetadata();
      const postClearLoggedData = metrics.serializeMetrics();

      expect(loggedData[metadataItem.name]).toEqual(metadataItem.value);
      expect(postClearLoggedData[metadataItem.name]).toBeUndefined();
    });
  });

  describe('Feature: Default Dimensions', () => {
    test('Adding more than max default dimensions should throw error', async () => {
      expect.assertions(1);

      const defaultDimensions: LooseObject = {};
      for (let x = 0; x < MAX_DIMENSION_COUNT + 1; x++) {
        defaultDimensions[`dimension-${x}`] = `value-${x}`;
      }

      const metrics = new Metrics({ namespace: 'test' });

      try {
        class LambdaFunction implements LambdaInterface {
          @metrics.logMetrics({ defaultDimensions: defaultDimensions })
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          public handler<TEvent, TResult>(
            _event: TEvent,
            _context: Context,
            _callback: Callback<TResult>,
          ): void | Promise<TResult> {
            return;
          }
        }

        await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      } catch (e) {
        expect((<Error>e).message).toBe('Max dimension count hit');
      }
    });

    test('Clearing dimensions should only remove added dimensions, not default', async () => {
      const metrics = new Metrics({ namespace: 'test' });
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };

      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ defaultDimensions: { default: 'defaultValue' } })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
          metrics.addDimension(additionalDimension.name, additionalDimension.value);
          const loggedData = metrics.serializeMetrics();
          expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(2);
          expect(loggedData[additionalDimension.name]).toEqual(additionalDimension.value);
          metrics.clearDimensions();
        }
      }

      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('default');
      expect(loggedData.default).toContain('defaultValue');
    });

    test('Clearing default dimensions should only remove default dimensions, not added', async () => {
      const metrics = new Metrics({ namespace: 'test' });
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };

      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ defaultDimensions: { default: 'defaultValue' } })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
          metrics.addDimension(additionalDimension.name, additionalDimension.value);
          metrics.clearDefaultDimensions();
        }
      }

      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain(additionalDimension.name);
      expect(loggedData[additionalDimension.name]).toContain(additionalDimension.value);
    });
  });

  describe('Feature: Cold Start', () => {
    test('Cold start metric should only be written out once and flushed automatically', async () => {
      const metrics = new Metrics({ namespace: 'test' });

      const handler = async (_event: DummyEvent, _context: Context): Promise<void> => {
        // Should generate only one log
        metrics.captureColdStartMetric();
      };

      await handler(dummyEvent, dummyContext.helloworldContext);
      await handler(dummyEvent, dummyContext.helloworldContext);
      const loggedData = [JSON.parse(consoleSpy.mock.calls[0][0])];

      expect(console.log).toBeCalledTimes(1);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData[0].ColdStart).toBe(1);
    });

    test('Cold start metric should only be written out once', async () => {
      const metrics = new Metrics({ namespace: 'test' });

      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ captureColdStartMetric: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
        }
      }

      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked again!'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(console.log).toBeCalledTimes(3);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData[0].ColdStart).toBe(1);
    });

    test('Cold should have service and function name if present', async () => {
      const serviceName = 'test-service';
      const metrics = new Metrics({ namespace: 'test', service: serviceName });

      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ captureColdStartMetric: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
        }
      }
      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData.service).toBe(serviceName);
      expect(loggedData.function_name).toBe(dummyContext.helloworldContext.functionName);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('service');
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('function_name');
      expect(loggedData.ColdStart).toBe(1);
    });

    test('Cold should still log, without a function name', async () => {
      const serviceName = 'test-service';
      const metrics = new Metrics({ namespace: 'test', service: serviceName });
      const newDummyContext = JSON.parse(JSON.stringify(dummyContext));
      delete newDummyContext.functionName;
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ captureColdStartMetric: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
        }
      }

      await new LambdaFunction().handler(dummyEvent, newDummyContext, () => console.log('Lambda invoked!'));
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData.service).toBe(serviceName);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('service');
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).not.toContain('function_name');
      expect(loggedData.ColdStart).toBe(1);
    });
  });

  describe('Feature: raiseOnEmptyMetrics', () => {
    test('Error should be thrown on empty metrics when raiseOnEmptyMetrics is passed', async () => {
      expect.assertions(1);

      const metrics = new Metrics({ namespace: 'test' });
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ raiseOnEmptyMetrics: true })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          return;
        }
      }

      try {
        await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      } catch (e) {
        expect((<Error>e).message).toBe('The number of metrics recorded must be higher than zero');
      }
    });

    test('Error should be thrown on empty metrics when raiseOnEmptyMetrics() is callse', async () => {
      expect.assertions(1);

      const metrics = new Metrics({ namespace: 'test' });
      const handler = async (_event: DummyEvent, _context: Context): Promise<void> => {
        metrics.raiseOnEmptyMetrics();
        // Logic goes here
        metrics.publishStoredMetrics();
      };

      try {
        await handler(dummyEvent, dummyContext.helloworldContext);
      } catch (e) {
        expect((<Error>e).message).toBe('The number of metrics recorded must be higher than zero');
      }
    });
  });

  describe('Feature: Auto log at limit', () => {
    test('Logger should write out block when limit is reached', async () => {
      const metrics = new Metrics({ namespace: 'test' });
      const extraCount = 10;
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          for (let x = 0; x < MAX_METRICS_SIZE + extraCount; x++) {
            metrics.addMetric(`test_name_${x}`, MetricUnits.Count, x);
          }
        }
      }

      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(100);
      expect(loggedData[1]._aws.CloudWatchMetrics[0].Metrics.length).toBe(extraCount);
    });
  });

  describe('Feature: Output validation ', () => {

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    beforeEach(() => {
      consoleSpy.mockClear();
    });

    test('Should use default namespace if no namespace is set', () => {
      delete process.env.POWERTOOLS_METRICS_NAMESPACE;
      const metrics = new Metrics();

      metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      const serializedMetrics = metrics.serializeMetrics();

      expect(serializedMetrics._aws.CloudWatchMetrics[0].Namespace).toBe(DEFAULT_NAMESPACE);
      expect(console.warn).toHaveBeenNthCalledWith(1, 'Namespace should be defined, default used');
    });

    test('Should contain a metric value if added once', ()=> {
      const metrics = new Metrics();
      
      metrics.addMetric('test_name', MetricUnits.Count, 1);
      const serializedMetrics = metrics.serializeMetrics();

      expect(serializedMetrics._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      
      expect(serializedMetrics['test_name']).toBe(1);
    });

    test('Should convert multiple metrics with the same name and unit into an array', ()=> {
      const metrics = new Metrics();
      
      metrics.addMetric('test_name', MetricUnits.Count, 2);
      metrics.addMetric('test_name', MetricUnits.Count, 1);
      const serializedMetrics = metrics.serializeMetrics();

      expect(serializedMetrics._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(serializedMetrics['test_name']).toStrictEqual([ 2, 1 ]);
    });

    test('Should throw an error if the same metric name is added again with a different unit', ()=> {
      const metrics = new Metrics();
      
      metrics.addMetric('test_name', MetricUnits.Count, 2);
      try {
        metrics.addMetric('test_name', MetricUnits.Seconds, 10);
      } catch (e) {
        expect((<Error>e).message).toBe('Metric "test_name" has already been added with unit "Count", but we received unit "Seconds". Did you mean to use metric unit "Count"?');
      }
    });

    test('Should contain multiple metric values if added with multiple names', ()=> {
      const metrics = new Metrics();
      
      metrics.addMetric('test_name', MetricUnits.Count, 1);
      metrics.addMetric('test_name2', MetricUnits.Count, 2);
      const serializedMetrics = metrics.serializeMetrics();

      expect(serializedMetrics._aws.CloudWatchMetrics[0].Metrics).toStrictEqual([
        { Name: 'test_name', Unit: 'Count' },
        { Name: 'test_name2', Unit: 'Count' },
      ]);
      
      expect(serializedMetrics['test_name']).toBe(1);
      expect(serializedMetrics['test_name2']).toBe(2);
    });
  });

  describe('Feature: Clearing Metrics ', () => {
    test('Clearing metrics should return empty', async () => {
      const metrics = new Metrics({ namespace: 'test' });
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ defaultDimensions: { default: 'defaultValue' } })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
          const loggedData = metrics.serializeMetrics();
          metrics.clearMetrics();
          const afterClearingLoggedData = metrics.serializeMetrics();

          expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toEqual(1);
          expect(afterClearingLoggedData._aws.CloudWatchMetrics[0].Metrics.length).toEqual(0);
        }
      }

      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
    });

    test('Purge Stored Metrics should log and clear', async () => {
      const metrics = new Metrics({ namespace: 'test' });
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name_1', MetricUnits.Count, 1);
          metrics.publishStoredMetrics();
        }
      }

      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(console.log).toBeCalledTimes(2);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[1]._aws.CloudWatchMetrics[0].Metrics.length).toBe(0);
    });

    test('Using decorator on async handler (without callback) should work fine', async () => {
      const metrics = new Metrics({ namespace: 'test' });
      const additionalDimension = { name: 'metric2', value: 'metric2Value' };

      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics({ defaultDimensions: { default: 'defaultValue' } })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context): Promise<string> {
          metrics.addMetric('test_name', MetricUnits.Seconds, 10);
          metrics.addDimension(additionalDimension.name, additionalDimension.value);
          const loggedData = metrics.serializeMetrics();
          expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(2);
          expect(loggedData[additionalDimension.name]).toEqual(additionalDimension.value);
          metrics.clearDimensions();

          return 'Lambda invoked!';
        }
      }

      await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext);
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(console.log).toBeCalledTimes(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0].length).toEqual(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Dimensions[0]).toContain('default');
      expect(loggedData.default).toContain('defaultValue');
    });

    test('Using decorator should log even if exception thrown', async () => {
      const metrics = new Metrics({ namespace: 'test' });
      class LambdaFunction implements LambdaInterface {
        @metrics.logMetrics()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        public handler<TEvent, TResult>(
          _event: TEvent,
          _context: Context,
          _callback: Callback<TResult>,
        ): void | Promise<TResult> {
          metrics.addMetric('test_name_1', MetricUnits.Count, 1);
          throw new Error('Test Error');
        }
      }

      try {
        await new LambdaFunction().handler(dummyEvent, dummyContext.helloworldContext, () => console.log('Lambda invoked!'));
      } catch (error) {
        // DO NOTHING
      }

      expect(console.log).toBeCalledTimes(1);
    });
  });

  describe('Feature: Custom Config Service', () => {
    test('Custom Config Service should be called for service', () => {
      const serviceName = 'Custom Provider Service Name';
      const namespace = 'Custom Provider namespace';
      const customConfigService = {
        getService: () => serviceName,
        getNamespace: () => namespace,
      };

      const metrics = new Metrics({ customConfigService: customConfigService });
      const loggedData = metrics.serializeMetrics();

      expect(loggedData.service).toEqual(serviceName);
      expect(loggedData._aws.CloudWatchMetrics[0].Namespace).toEqual(namespace);
    });
  });
});
