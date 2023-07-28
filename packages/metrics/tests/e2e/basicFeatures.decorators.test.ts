/**
 * Test metrics standard functions
 *
 * @group e2e/metrics/decorator
 */
import path from 'path';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import { v4 } from 'uuid';
import {
  generateUniqueName,
  isValidRuntimeKey,
  createStackWithLambdaFunction,
  invokeFunction,
} from '../../../commons/tests/utils/e2eUtils';
import {
  TestStack,
  defaultRuntime,
} from '@aws-lambda-powertools/testing-utils';
import { MetricUnits } from '../../src';
import {
  ONE_MINUTE,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';
import { getMetrics } from '../helpers/metricsUtils';

const runtime: string = process.env.RUNTIME || defaultRuntime;

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'decorator'
);
const functionName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'decorator'
);
const lambdaFunctionCodeFile = 'basicFeatures.decorator.test.functionCode.ts';

const cloudwatchClient = new CloudWatchClient({});

const invocationCount = 2;
const startTime = new Date();

// Parameters to be used by Metrics in the Lambda function
const expectedNamespace = uuid; // to easily find metrics back at assert phase
const expectedServiceName = 'e2eDecorator';
const expectedMetricName = 'MyMetric';
const expectedMetricUnit = MetricUnits.Count;
const expectedMetricValue = '1';
const expectedDefaultDimensions = { MyDimension: 'MyValue' };
const expectedExtraDimension = { MyExtraDimension: 'MyExtraValue' };
const expectedSingleMetricDimension = { MySingleMetricDim: 'MySingleValue' };
const expectedSingleMetricName = 'MySingleMetric';
const expectedSingleMetricUnit = MetricUnits.Percent;
const expectedSingleMetricValue = '2';

const testStack = new TestStack(stackName);

describe(`metrics E2E tests (decorator) for runtime: ${runtime}`, () => {
  beforeAll(async () => {
    // GIVEN a stack
    createStackWithLambdaFunction({
      stack: testStack.stack,
      functionName: functionName,
      functionEntry: path.join(__dirname, lambdaFunctionCodeFile),
      tracing: Tracing.ACTIVE,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'metrics-e2e-testing',
        UUID: uuid,

        // Parameter(s) to be used by Metrics in the Lambda function
        EXPECTED_NAMESPACE: expectedNamespace,
        EXPECTED_SERVICE_NAME: expectedServiceName,
        EXPECTED_METRIC_NAME: expectedMetricName,
        EXPECTED_METRIC_UNIT: expectedMetricUnit,
        EXPECTED_METRIC_VALUE: expectedMetricValue,
        EXPECTED_DEFAULT_DIMENSIONS: JSON.stringify(expectedDefaultDimensions),
        EXPECTED_EXTRA_DIMENSION: JSON.stringify(expectedExtraDimension),
        EXPECTED_SINGLE_METRIC_DIMENSION: JSON.stringify(
          expectedSingleMetricDimension
        ),
        EXPECTED_SINGLE_METRIC_NAME: expectedSingleMetricName,
        EXPECTED_SINGLE_METRIC_UNIT: expectedSingleMetricUnit,
        EXPECTED_SINGLE_METRIC_VALUE: expectedSingleMetricValue,
      },
      runtime: runtime,
    });

    await testStack.deploy();

    // and invoked
    await invokeFunction(functionName, invocationCount, 'SEQUENTIAL');
  }, SETUP_TIMEOUT);
  describe('ColdStart metrics', () => {
    it(
      'should capture ColdStart Metric',
      async () => {
        const expectedDimensions = [
          { Name: 'service', Value: expectedServiceName },
          { Name: 'function_name', Value: functionName },
          {
            Name: Object.keys(expectedDefaultDimensions)[0],
            Value: expectedDefaultDimensions.MyDimension,
          },
        ];
        // Check coldstart metric dimensions
        const coldStartMetrics = await getMetrics(
          cloudwatchClient,
          expectedNamespace,
          'ColdStart',
          1
        );

        expect(coldStartMetrics.Metrics?.length).toBe(1);
        const coldStartMetric = coldStartMetrics.Metrics?.[0];
        expect(coldStartMetric?.Dimensions).toStrictEqual(expectedDimensions);

        // Check coldstart metric value
        const adjustedStartTime = new Date(startTime.getTime() - ONE_MINUTE);
        const endTime = new Date(new Date().getTime() + ONE_MINUTE);
        console.log(
          `Manual command: aws cloudwatch get-metric-statistics --namespace ${expectedNamespace} --metric-name ColdStart --start-time ${Math.floor(
            adjustedStartTime.getTime() / 1000
          )} --end-time ${Math.floor(
            endTime.getTime() / 1000
          )} --statistics 'Sum' --period 60 --dimensions '${JSON.stringify(
            expectedDimensions
          )}'`
        );
        const coldStartMetricStat = await cloudwatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: expectedNamespace,
            StartTime: adjustedStartTime,
            Dimensions: expectedDimensions,
            EndTime: endTime,
            Period: 60,
            MetricName: 'ColdStart',
            Statistics: ['Sum'],
          })
        );

        // Despite lambda has been called twice, coldstart metric sum should only be 1
        const singleDataPoint = coldStartMetricStat.Datapoints
          ? coldStartMetricStat.Datapoints[0]
          : {};
        expect(singleDataPoint?.Sum).toBe(1);
      },
      TEST_CASE_TIMEOUT
    );
  });

  describe('Default and extra dimensions', () => {
    it(
      'should produce a Metric with the default and extra one dimensions',
      async () => {
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
          {
            Name: Object.keys(expectedExtraDimension)[0],
            Value: expectedExtraDimension.MyExtraDimension,
          },
        ];
        expect(metric?.Dimensions).toStrictEqual(expectedDimensions);

        // Check coldstart metric value
        const adjustedStartTime = new Date(
          startTime.getTime() - 3 * ONE_MINUTE
        );
        const endTime = new Date(new Date().getTime() + ONE_MINUTE);
        console.log(
          `Manual command: aws cloudwatch get-metric-statistics --namespace ${expectedNamespace} --metric-name ${expectedMetricName} --start-time ${Math.floor(
            adjustedStartTime.getTime() / 1000
          )} --end-time ${Math.floor(
            endTime.getTime() / 1000
          )} --statistics 'Sum' --period 60 --dimensions '${JSON.stringify(
            expectedDimensions
          )}'`
        );
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

        // Since lambda has been called twice in this test and potentially more in others, metric sum should be at least of expectedMetricValue * invocationCount
        const singleDataPoint = metricStat.Datapoints
          ? metricStat.Datapoints[0]
          : {};
        expect(singleDataPoint?.Sum).toBeGreaterThanOrEqual(
          parseInt(expectedMetricValue) * invocationCount
        );
      },
      TEST_CASE_TIMEOUT
    );
  });
  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
