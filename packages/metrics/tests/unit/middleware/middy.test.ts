/**
 * Test metrics middleware
 *
 * @group unit/metrics/middleware
 */
import {
  Metrics,
  MetricUnits,
  logMetrics,
  MetricResolution,
} from '../../../../metrics/src';
import middy from '@middy/core';
import { ExtraOptions } from '../../../src/types';
import { cleanupMiddlewares } from '@aws-lambda-powertools/commons/lib/middleware';
import { helloworldContext as dummyContext } from '@aws-lambda-powertools/commons/lib/samples/resources/contexts/hello-world';
import { CustomEvent as dummyEvent } from '@aws-lambda-powertools/commons/lib/samples/resources/events/custom/index';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
const mockDate = new Date(1466424490000);
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

describe('Middy middleware', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('throwOnEmptyMetrics', () => {
    test('should throw on empty metrics if set to true', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        console.log('do nothing');
      };

      const handler = middy(lambdaHandler).use(
        logMetrics(metrics, { throwOnEmptyMetrics: true })
      );

      try {
        await handler(dummyEvent, dummyContext, () =>
          console.log('Lambda invoked!')
        );
      } catch (e) {
        expect((<Error>e).message).toBe(
          'The number of metrics recorded must be higher than zero'
        );
      }
    });

    test('should not throw on empty metrics if set to false', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        console.log('do nothing');
      };

      const handler = middy(lambdaHandler).use(
        logMetrics(metrics, { throwOnEmptyMetrics: false })
      );

      try {
        await handler(dummyEvent, dummyContext, () =>
          console.log('Lambda invoked!')
        );
      } catch (e) {
        fail(`Should not throw but got the following Error: ${e}`);
      }
    });

    test('should not throw on empty metrics if not set, but should log a warning', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });
      const lambdaHandler = async (): Promise<void> => {
        console.log('do nothing');
      };
      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act & Assess
      await expect(
        handler(dummyEvent, dummyContext)
      ).resolves.not.toThrowError();
      expect(consoleWarnSpy).toBeCalledTimes(1);
      expect(consoleWarnSpy).toBeCalledWith(
        'No application metrics to publish. The cold-start metric may be published if enabled. If application metrics should never be empty, consider using `throwOnEmptyMetrics`'
      );
    });
  });

  describe('captureColdStartMetric', () => {
    test('should capture cold start metric if set to true', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        console.log('{"message": "do nothing"}');
      };

      const handler = middy(lambdaHandler).use(
        logMetrics(metrics, { captureColdStartMetric: true })
      );

      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked! again')
      );
      const loggedData = [
        JSON.parse(consoleSpy.mock.calls[0][0]),
        JSON.parse(consoleSpy.mock.calls[1][0]),
      ];

      expect(console.log).toBeCalledTimes(5);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe(
        'ColdStart'
      );
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe(
        'Count'
      );
      expect(loggedData[0].ColdStart).toBe(1);
    });

    test('should not capture cold start metrics if set to false', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        console.log('{"message": "do nothing"}');
      };

      const handler = middy(lambdaHandler).use(
        logMetrics(metrics, { captureColdStartMetric: false })
      );

      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked! again')
      );
      const loggedData = [
        JSON.parse(consoleSpy.mock.calls[0][0]),
        JSON.parse(consoleSpy.mock.calls[1][0]),
      ];

      expect(loggedData[0]._aws).toBe(undefined);
    });

    test('should not throw on empty metrics if not set', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        console.log('{"message": "do nothing"}');
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked! again')
      );
      const loggedData = [
        JSON.parse(consoleSpy.mock.calls[0][0]),
        JSON.parse(consoleSpy.mock.calls[1][0]),
      ];

      expect(loggedData[0]._aws).toBe(undefined);
    });
  });

  describe('logMetrics', () => {
    test('when a metrics instance receive multiple metrics with the same name, it prints multiple values in an array format', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 2);
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );

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
          successfulBooking: [2, 1],
        })
      );
    });

    test('when a metrics instance is passed WITH custom options, it prints the metrics in the stdout', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };
      const metricsOptions: ExtraOptions = {
        throwOnEmptyMetrics: true,
        defaultDimensions: { environment: 'prod', aws_region: 'eu-west-1' },
        captureColdStartMetric: true,
      };
      const handler = middy(lambdaHandler).use(
        logMetrics(metrics, metricsOptions)
      );

      // Act
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [
                  ['service', 'environment', 'aws_region', 'function_name'],
                ],
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
                Dimensions: [['service', 'environment', 'aws_region']],
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
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );

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
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };
      const metricsOptions: ExtraOptions = {
        throwOnEmptyMetrics: true,
      };
      const handler = middy(lambdaHandler).use(
        logMetrics([metrics], metricsOptions)
      );

      // Act
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );

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

    test('when enabled, and another middleware returns early, it still publishes the metrics at the end of the execution', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });
      const publishStoredMetricsSpy = jest.spyOn(
        metrics,
        'publishStoredMetrics'
      );
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
      const handler = middy(
        (_event: typeof dummyEvent & { idx: number }): void => {
          metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        }
      )
        .use(logMetrics(metrics))
        .use(myCustomMiddleware());

      // Act
      await handler({ ...dummyEvent, idx: 0 }, dummyContext);
      await handler({ ...dummyEvent, idx: 1 }, dummyContext);

      // Assess
      expect(publishStoredMetricsSpy).toBeCalledTimes(2);
    });
  });
  describe('Metrics resolution', () => {
    test('serialized metrics in EMF format should not contain `StorageResolution` as key if `60` is set', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        metrics.addMetric(
          'successfulBooking',
          MetricUnits.Count,
          1,
          MetricResolution.Standard
        );
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(console.log).toHaveBeenCalledWith(
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [['service']],
                Metrics: [
                  {
                    Name: 'successfulBooking',
                    Unit: 'Count',
                  },
                ],
              },
            ],
          },
          service: 'orders',
          successfulBooking: 1,
        })
      );
    });

    test('Should be StorageResolution `1` if MetricResolution is set to `High`', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });

      const lambdaHandler = (): void => {
        metrics.addMetric(
          'successfulBooking',
          MetricUnits.Count,
          1,
          MetricResolution.High
        );
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act
      await handler(dummyEvent, dummyContext, () =>
        console.log('Lambda invoked!')
      );

      // Assess
      expect(console.log).toHaveBeenCalledWith(
        JSON.stringify({
          _aws: {
            Timestamp: 1466424490000,
            CloudWatchMetrics: [
              {
                Namespace: 'serverlessAirline',
                Dimensions: [['service']],
                Metrics: [
                  {
                    Name: 'successfulBooking',
                    Unit: 'Count',
                    StorageResolution: 1,
                  },
                ],
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
