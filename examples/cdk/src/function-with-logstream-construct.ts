import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import type { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  type NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';

type AccessMode = 'RO' | 'RW';

type BindTableProps = {
  /**
   * The DynamoDB table to bind the function to
   */
  table: Table;
  /**
   * The access mode for the table, defaults to 'RO' (read-only)
   * @default 'RO'
   */
  accessMode?: AccessMode;
  /**
   * Whether to grant the function access to the table only,
   * @default false
   */
  accessOnly?: boolean;
  /**
   * The name of the environment variable to use for the table name.
   * @default `TABLE_NAME`
   */
  envVarName?: string;
};

export class FunctionWithLogGroup extends NodejsFunction {
  public constructor(scope: Construct, id: string, props: NodejsFunctionProps) {
    const { functionName } = props;

    super(scope, id, {
      ...props,
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      tracing: Tracing.ACTIVE,
      timeout: Duration.seconds(30),
      environment: {
        NODE_OPTIONS: '--enable-source-maps', // see https://docs.aws.amazon.com/lambda/latest/dg/typescript-exceptions.html
      },
      logGroup: new LogGroup(scope, `${id}-LogGroup`, {
        logGroupName: `/aws/lambda/${functionName}`,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: RetentionDays.ONE_DAY,
      }),
    });
  }

  /**
   * Binds the function to a DynamoDB table by adding the table name to the environment
   * under the key `TABLE_NAME` and granting the function read-only or read-write access
   * based on the access mode provided.
   *
   * @param table The DynamoDB table to bind the function to
   * @param accessMode The access mode for the table, defaults to 'RO' (read-only)
   * @param envVarName The name of the environment variable to use for the table name, defaults to `TABLE_NAME`
   */
  public bindTable({
    table,
    accessMode,
    accessOnly,
    envVarName,
  }: BindTableProps): void {
    if (accessOnly !== true) {
      this.addEnvironment(envVarName || 'TABLE_NAME', table.tableName);
    }
    if (accessMode === 'RW') {
      table.grantReadWriteData(this);

      return;
    }
    table.grantReadData(this);
  }
}
