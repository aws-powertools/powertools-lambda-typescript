import { join } from 'node:path';
import {
  invokeFunction,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getMetrics, sortDimensions } from '../helpers/metricsUtils.js';
import { MetricsTestNodejsFunction } from '../helpers/resources.js';
import { commonEnvironmentVars, RESOURCE_NAME_PREFIX } from './constants.js';

// The `using` keyword requires Node.js 24 or newer.
describe.skipIf(Number(process.versions.node.split('.')[0]) < 24)(
  'Metrics E2E tests, using keyword',
  () => {
    const testStack = new TestStack({
      stackNameProps: {
        stackNamePrefix: RESOURCE_NAME_PREFIX,
        testName: 'BasicFeatures-Using',
      },
    });

    // Location of the lambda function code
    const lambdaFunctionCodeFilePath = join(
      __dirname,
      'basicFeatures.using.test.functionCode.ts'
    );
    const startTime = new Date();

    const expectedServiceName = 'e2eUsing';
    new MetricsTestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        environment: {
          EXPECTED_SERVICE_NAME: expectedServiceName,
        },
      },
      {
        nameSuffix: 'Using',
      }
    );

    const cloudwatchClient = new CloudWatchClient({});
    const invocations = 2;

    beforeAll(async () => {
      // Deploy the stack
      await testStack.deploy();

      // Get the actual function names from the stack outputs
      const functionName = testStack.findAndGetStackOutputValue('Using');

      // Act
      await invokeFunction({
        functionName,
        times: invocations,
        invocationMode: 'SEQUENTIAL',
      });
    });

    describe('ColdStart metrics', () => {
      it('captures the ColdStart Metric', async () => {
        const { EXPECTED_NAMESPACE: expectedNamespace } = commonEnvironmentVars;

        // Check coldstart metric dimensions
        const coldStartMetrics = await getMetrics(
          cloudwatchClient,
          expectedNamespace,
          'ColdStart',
          1
        );
        expect(coldStartMetrics.Metrics?.length).toBe(1);
        const coldStartMetric = coldStartMetrics.Metrics?.[0];
        expect(coldStartMetric?.Dimensions).toContainEqual({
          Name: 'service',
          Value: expectedServiceName,
        });

        // Check coldstart metric value
        const adjustedStartTime = new Date(startTime.getTime() - 60 * 1000);
        const endTime = new Date(Date.now() + 60 * 1000);
        const coldStartMetricStat = await cloudwatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: expectedNamespace,
            StartTime: adjustedStartTime,
            Dimensions: [{ Name: 'service', Value: expectedServiceName }],
            EndTime: endTime,
            Period: 60,
            MetricName: 'ColdStart',
            Statistics: ['Sum'],
          })
        );

        // Despite the lambda being called twice, the coldstart metric sum should only be 1
        const singleDataPoint = coldStartMetricStat.Datapoints
          ? coldStartMetricStat.Datapoints[0]
          : {};
        expect(singleDataPoint?.Sum).toBe(1);
      });
    });

    describe('Default dimensions', () => {
      it('produces a Metric with the default dimensions', async () => {
        const {
          EXPECTED_NAMESPACE: expectedNamespace,
          EXPECTED_METRIC_NAME: expectedMetricName,
          EXPECTED_METRIC_VALUE: expectedMetricValue,
          EXPECTED_DEFAULT_DIMENSIONS: expectedDefaultDimensions,
        } = commonEnvironmentVars;

        // Check metric dimensions
        const metrics = await getMetrics(
          cloudwatchClient,
          expectedNamespace,
          expectedMetricName,
          1
        );

        expect(metrics.Metrics?.length).toBe(1);
        const metric = metrics.Metrics?.[0];
        const expectedDimensions = [
          { Name: 'service', Value: expectedServiceName },
          {
            Name: Object.keys(expectedDefaultDimensions)[0],
            Value: expectedDefaultDimensions.MyDimension,
          },
        ];
        expect(sortDimensions(metric?.Dimensions)).toStrictEqual(
          sortDimensions(expectedDimensions)
        );

        // Check metric value
        const adjustedStartTime = new Date(startTime.getTime() - 3 * 60 * 1000);
        const endTime = new Date(Date.now() + 60 * 1000);
        const metricStat = await cloudwatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: expectedNamespace,
            StartTime: adjustedStartTime,
            Dimensions: expectedDimensions,
            EndTime: endTime,
            Period: 60,
            MetricName: expectedMetricName,
            Statistics: ['Sum'],
          })
        );

        // Since the lambda has been called twice in this test, the metric sum should be at least of expectedMetricValue * invocationCount
        const singleDataPoint = metricStat.Datapoints
          ? metricStat.Datapoints[0]
          : {};
        expect(singleDataPoint.Sum).toBeGreaterThanOrEqual(
          Number.parseInt(expectedMetricValue, 10) * invocations
        );
      });
    });

    afterAll(async () => {
      if (!process.env.DISABLE_TEARDOWN) {
        await testStack.destroy();
      }
    });
  }
);
