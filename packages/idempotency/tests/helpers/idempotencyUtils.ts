import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { v4 } from 'uuid';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { TEST_RUNTIMES } from '../../../commons/tests/utils/e2eUtils';
import { BasePersistenceLayer } from '../../src/persistence';
import path from 'path';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

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
  const uniqueTableId = ddbTableName + v4().substring(0, 5);
  const ddbTable = new Table(stack, uniqueTableId, {
    tableName: ddbTableName,
    partitionKey: {
      name: ddbPkId ? ddbPkId : 'id',
      type: AttributeType.STRING,
    },
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const uniqueFunctionId = functionName + v4().substring(0, 5);
  const nodeJsFunction = new NodejsFunction(stack, uniqueFunctionId, {
    runtime: TEST_RUNTIMES[runtime],
    functionName: functionName,
    entry: path.join(__dirname, `../e2e/${pathToFunction}`),
    timeout: Duration.seconds(timeout || 30),
    handler: handler,
    environment: {
      IDEMPOTENCY_TABLE_NAME: ddbTableName,
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
    },
    logRetention: RetentionDays.ONE_DAY,
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
