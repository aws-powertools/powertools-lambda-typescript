/**
 * Test metrics middleware
 *
 * @group unit/metrics/middleware
 */

import { Metrics, MetricUnits, logMetrics } from '../../../../metrics/src';
import middy from '@middy/core';
import { ExtraOptions } from '../../../src/types';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

describe('Middy middleware', () => {
  
  const dummyEvent = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
  };
  const dummyContext = {
    callbackWaitsForEmptyEventLoop: true,
    functionVersion: '$LATEST',
    functionName: 'foo-bar-function',
    memoryLimitInMB: '128',
    logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
    logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
    invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:Example',
    awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
    getRemainingTimeInMillis: () => 1234,
    done: () => console.log('Done!'),
    fail: () => console.log('Failed!'),
    succeed: () => console.log('Succeeded!'),
  };
  
  beforeEach(() => {
    jest.resetModules();
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  describe('throwOnEmptyMetrics', () => {

    test('should throw on empty metrics if set to true', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        console.log('do nothing');
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics, { throwOnEmptyMetrics: true }));

      try {
        await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      } catch (e) {
        expect((<Error>e).message).toBe('The number of metrics recorded must be higher than zero');
      }
    });

    test('should not throw on empty metrics if set to false', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        console.log('do nothing');
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics, { throwOnEmptyMetrics: false }));

      try {
        await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      } catch (e) {
        fail(`Should not throw but got the following Error: ${e}`);
      }
    });

    test('should not throw on empty metrics if not set', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        console.log('do nothing');
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      try {
        await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      } catch (e) {
        fail(`Should not throw but got the following Error: ${e}`);
      }
    });
  });

  describe('captureColdStartMetric', () => {

    test('should capture cold start metric if set to true', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        console.log('{"message": "do nothing"}');
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics, { captureColdStartMetric: true }));

      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked! again'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(console.log).toBeCalledTimes(5);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe('ColdStart');
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Count');
      expect(loggedData[0].ColdStart).toBe(1);
    });

    test('should not capture cold start metrics if set to false', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        console.log('{"message": "do nothing"}');
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics, { captureColdStartMetric: false }));

      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked! again'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(loggedData[0]._aws).toBe(undefined);
    });

    test('should not throw on empty metrics if not set', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        console.log('{"message": "do nothing"}');
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked! again'));
      const loggedData = [ JSON.parse(consoleSpy.mock.calls[0][0]), JSON.parse(consoleSpy.mock.calls[1][0]) ];

      expect(loggedData[0]._aws).toBe(undefined);
    });
  });

  describe('logMetrics', () => {

    test('when a metrics instance receive multiple metrics with the same name, it prints multiple values in an array format', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 2);
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act
      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [['service']],
                Metrics: [{ Name: 'successfulBooking', Unit: 'Count' }],
              },
            ],
          },
          service: 'orders',
          successfulBooking: [ 2, 1 ],
        })
      );
    });

    test('when a metrics instance is passed WITH custom options, it prints the metrics in the stdout', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };
      const metricsOptions: ExtraOptions = {
        throwOnEmptyMetrics: true,
        defaultDimensions: { environment: 'prod', aws_region: 'eu-west-1' },
        captureColdStartMetric: true,
      };
      const handler = middy(lambdaHandler).use(logMetrics(metrics, metricsOptions));

      // Act
      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [[ 'service', 'environment', 'aws_region', 'function_name' ]],
                Metrics: [{ Name: 'ColdStart', Unit: 'Count' }],
              },
            ],
          },
          service: 'orders',
          environment: 'prod',
          aws_region: 'eu-west-1',
          function_name: 'foo-bar-function',
          ColdStart: 1,
        })
      );
      expect(console.log).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [[ 'service', 'environment', 'aws_region' ]],
                Metrics: [{ Name: 'successfulBooking', Unit: 'Count' }],
              },
            ],
          },
          service: 'orders',
          environment: 'prod',
          aws_region: 'eu-west-1',
          successfulBooking: 1,
        })
      );
    });

    test('when a metrics instance is passed WITHOUT custom options, it prints the metrics in the stdout', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act
      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [['service']],
                Metrics: [{ Name: 'successfulBooking', Unit: 'Count' }],
              },
            ],
          },
          service: 'orders',
          successfulBooking: 1,
        })
      );
    });

    test('when an array of Metrics instances is passed, it prints the metrics in the stdout', async () => {
      // Prepare
      const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };
      const metricsOptions: ExtraOptions = {
        throwOnEmptyMetrics: true,
      };
      const handler = middy(lambdaHandler).use(logMetrics([metrics], metricsOptions));

      // Act
      await handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [['service']],
                Metrics: [{ Name: 'successfulBooking', Unit: 'Count' }],
              },
            ],
          },
          service: 'orders',
          successfulBooking: 1,
        })
      );
    });
  });
});
