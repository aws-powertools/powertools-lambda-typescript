import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

export class IdempotencyStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'idempotencyTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: 'expiration',
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const fnHandler = new NodejsFunction(this, 'helloWorldFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: 'src/index.ts',
      environment: {
        IDEMPOTENCY_TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(fnHandler);
  }
}
