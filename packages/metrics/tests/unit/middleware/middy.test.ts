/**
 * Test metrics middleware
 *
 * @group unit/metrics/middleware
 */

import { Metrics, MetricUnits, logMetrics } from '../../../../metrics/src';
import middy from '@middy/core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as event from '../../../../../tests/resources/events/custom/hello-world.json';
import { ExtraOptions } from '../../../src/types';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

describe('Middy middleware', () => {

  beforeEach(() => {
    jest.resetModules();
    consoleSpy.mockClear();
    dateSpy.mockClear();
  });

  describe('logMetrics', () => {

    const getRandomInt = (): number => Math.floor(Math.random() * 1000000000);
    const awsRequestId = getRandomInt().toString();

    const context = {
      callbackWaitsForEmptyEventLoop: true,
      functionVersion: '$LATEST',
      functionName: 'foo-bar-function',
      memoryLimitInMB: '128',
      logGroupName: '/aws/lambda/foo-bar-function',
      logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
      invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:foo-bar-function',
      awsRequestId: awsRequestId,
      getRemainingTimeInMillis: () => 1234,
      done: () => console.log('Done!'),
      fail: () => console.log('Failed!'),
      succeed: () => console.log('Succeeded!'),
    };

    test('when a metrics instance receive multiple metrics with the same name, it prints multiple values in an array format', async () => {
      // Prepare
      const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 2);
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));
      
      // Act
      await handler(event, context, () => console.log('Lambda invoked!'));
      
      // Assess
      expect(console.log).toHaveBeenNthCalledWith(1, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'serverlessAirline',
            'Dimensions': [
              ['service']
            ],
            'Metrics': [{ 'Name': 'successfulBooking', 'Unit': 'Count' }],
          }],
        },
        'service': 'orders',
        'successfulBooking': [
          2,
          1,
        ],
      }));
    });

    test('when a metrics instance is passed WITH custom options, it prints the metrics in the stdout', async () => {

      // Prepare
      const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };
      const metricsOptions: ExtraOptions = {
        raiseOnEmptyMetrics: true,
        defaultDimensions: { environment : 'prod', aws_region: 'eu-central-1' },
        captureColdStartMetric: true
      };
      const handler = middy(lambdaHandler).use(logMetrics(metrics, metricsOptions));

      // Act
      await handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(1, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'serverlessAirline',
            'Dimensions': [
              [ 'environment', 'aws_region', 'service', 'function_name' ]
            ],
            'Metrics': [{ 'Name': 'ColdStart', 'Unit': 'Count' }],
          }],
        },
        'environment': 'prod',
        'aws_region' : 'eu-central-1',
        'service': 'orders',
        'function_name': 'foo-bar-function',
        'ColdStart': 1,
      }));
      expect(console.log).toHaveBeenNthCalledWith(2, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'serverlessAirline',
            'Dimensions': [
              [ 'environment', 'aws_region', 'service' ]
            ],
            'Metrics': [{ 'Name': 'successfulBooking', 'Unit': 'Count' }],
          }],
        },
        'environment': 'prod',
        'aws_region' : 'eu-central-1',
        'service': 'orders',
        'successfulBooking': 1,
      }));

    });

    test('when a metrics instance is passed WITHOUT custom options, it prints the metrics in the stdout', async () => {

      // Prepare
      const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };

      const handler = middy(lambdaHandler).use(logMetrics(metrics));

      // Act
      await handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(1, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'serverlessAirline',
            'Dimensions': [
              ['service']
            ],
            'Metrics': [{ 'Name': 'successfulBooking', 'Unit': 'Count' }],
          }],
        },
        'service': 'orders',
        'successfulBooking': 1,
      }));

    });

    test('when an array of Metrics instances is passed, it prints the metrics in the stdout', async () => {

      // Prepare
      const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });

      const lambdaHandler = (): void => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
      };
      const metricsOptions: ExtraOptions = {
        raiseOnEmptyMetrics: true
      };
      const handler = middy(lambdaHandler).use(logMetrics([metrics], metricsOptions));

      // Act
      await handler(event, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(console.log).toHaveBeenNthCalledWith(1, JSON.stringify({
        '_aws': {
          'Timestamp': 1466424490000,
          'CloudWatchMetrics': [{
            'Namespace': 'serverlessAirline',
            'Dimensions': [
              ['service']
            ],
            'Metrics': [{ 'Name': 'successfulBooking', 'Unit': 'Count' }],
          }],
        },
        'service': 'orders',
        'successfulBooking': 1,
      }));

    });

  });

});