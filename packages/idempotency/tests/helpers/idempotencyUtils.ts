import {
  TestNodejsFunction,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { randomUUID } from 'node:crypto';
import { BasePersistenceLayer } from '../../src/persistence';

export const createIdempotencyResources = (
  stack: Stack,
  runtime: string,
  ddbTableName: string,
  pathToFunction: string,
  functionName: string,
  handler: string,
  ddbPkId?: string,
  timeout?: number
): void => {
  const uniqueTableId = ddbTableName + randomUUID().substring(0, 5);
  const ddbTable = new Table(stack, uniqueTableId, {
    tableName: ddbTableName,
    partitionKey: {
      name: ddbPkId ? ddbPkId : 'id',
      type: AttributeType.STRING,
    },
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const uniqueFunctionId = functionName + randomUUID().substring(0, 5);
  const nodeJsFunction = new TestNodejsFunction(stack, uniqueFunctionId, {
    functionName: functionName,
    entry: pathToFunction,
    runtime: TEST_RUNTIMES[runtime as keyof typeof TEST_RUNTIMES],
    timeout: Duration.seconds(timeout || 30),
    handler: handler,
    environment: {
      IDEMPOTENCY_TABLE_NAME: ddbTableName,
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
    },
  });

  ddbTable.grantReadWriteData(nodeJsFunction);
};

/**
 * Dummy class to test the abstract class BasePersistenceLayer.
 *
 * This class is used in the unit tests.
 */
class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

export { PersistenceLayerTestClass };
