import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { v4 } from 'uuid';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { TEST_RUNTIMES } from '../../../commons/tests/utils/e2eUtils';
import path from 'path';

export const createIdempotencyResources = (stack: Stack, runtime: string, ddbTableName: string, pathToFunction: string, functionName: string, handler: string, ddbPkId?: string): void => {
  const uniqueTableId = ddbTableName + v4().substring(0, 5);
  const ddbTable = new Table(stack, uniqueTableId, {
    tableName: ddbTableName,
    partitionKey: {
      name: ddbPkId ? ddbPkId : 'id',
      type: AttributeType.STRING,
    },
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY
  });

  const uniqueFunctionId = functionName + v4().substring(0, 5);
  const nodeJsFunction = new NodejsFunction(stack, uniqueFunctionId, {
    runtime: TEST_RUNTIMES[runtime],
    functionName: functionName,
    entry: path.join(__dirname, `../e2e/${pathToFunction}`),
    timeout: Duration.seconds(30),
    handler: handler,
    environment: {
      IDEMPOTENCY_TABLE_NAME: ddbTableName,
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
    }
  });

  ddbTable.grantReadWriteData(nodeJsFunction);

};