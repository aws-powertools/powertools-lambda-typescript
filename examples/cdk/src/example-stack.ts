import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { LayerVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

const commonProps: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_20_X,
  tracing: Tracing.ACTIVE,
  timeout: Duration.seconds(30),
  logRetention: RetentionDays.ONE_DAY,
  environment: {
    NODE_OPTIONS: '--enable-source-maps', // see https://docs.aws.amazon.com/lambda/latest/dg/typescript-exceptions.html
    POWERTOOLS_SERVICE_NAME: 'items-store',
    POWERTOOLS_METRICS_NAMESPACE: 'PowertoolsCDKExample',
    POWERTOOLS_LOG_LEVEL: 'DEBUG',
  },
  bundling: {
    externalModules: [
      '@aws-lambda-powertools/commons',
      '@aws-lambda-powertools/logger',
      '@aws-lambda-powertools/tracer',
      '@aws-lambda-powertools/metrics',
      '@aws-lambda-powertools/parameters',
    ],
  },
  layers: [],
};

export class CdkAppStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uuidApi = new UuidApi(this, 'uuid-api');

    const table = new Table(this, 'Table', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        type: AttributeType.STRING,
        name: 'id',
      },
    });

    commonProps.layers?.push(
      LayerVersion.fromLayerVersionArn(
        this,
        'powertools-layer',
        `arn:aws:lambda:${
          Stack.of(this).region
        }:094274105915:layer:AWSLambdaPowertoolsTypeScript:24`
      )
    );

    const putItemFn = new NodejsFunction(this, 'put-item-fn', {
      ...commonProps,
      entry: './functions/put-item.ts',
      handler: 'handler',
    });
    putItemFn.addEnvironment('SAMPLE_TABLE', table.tableName);
    table.grantWriteData(putItemFn);

    const getAllItemsFn = new NodejsFunction(this, 'get-all-items-fn', {
      ...commonProps,
      entry: './functions/get-all-items.ts',
      handler: 'handler',
    });
    getAllItemsFn.addEnvironment('SAMPLE_TABLE', table.tableName);
    table.grantReadData(getAllItemsFn);

    const getByIdFn = new NodejsFunction(this, 'get-by-id-fn', {
      ...commonProps,
      entry: './functions/get-by-id.ts',
      handler: 'handler',
    });

    uuidApi.apiUrlParam.grantRead(getByIdFn);
    uuidApi.apiUrlParam.grantRead(putItemFn);
    uuidApi.apiUrlParam.grantRead(getAllItemsFn);

    getByIdFn.addEnvironment('SAMPLE_TABLE', table.tableName);
    table.grantReadData(getByIdFn);

    const api = new RestApi(this, 'items-api', {
      restApiName: 'Items Service',
      description: 'This service serves items.',
      deployOptions: {
        tracingEnabled: true,
      },
    });

    const itemPutIntegration = new LambdaIntegration(putItemFn);
    api.root.addMethod('POST', itemPutIntegration);

    const itemsIntegration = new LambdaIntegration(getAllItemsFn);
    api.root.addMethod('GET', itemsIntegration);

    const item = api.root.addResource('{id}');
    const itemIntegration = new LambdaIntegration(getByIdFn);
    item.addMethod('GET', itemIntegration);
  }
}

class UuidApi extends Construct {
  public readonly apiUrlParam: StringParameter;
  public constructor(scope: Construct, id: string) {
    super(scope, id);

    const uuidFn = new NodejsFunction(this, 'UuidFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: './functions/uuid.ts',
    });

    const api = new RestApi(this, 'uuid-api', {
      restApiName: 'UUID Service',
      description: 'This service serves UUIDs.',
      deployOptions: {
        tracingEnabled: true,
      },
    });

    const uuidIntegration = new LambdaIntegration(uuidFn);
    const uuid = api.root.addResource('uuid');
    uuid.addMethod('GET', uuidIntegration);

    this.apiUrlParam = new StringParameter(this, 'uuid-api-url', {
      parameterName: '/app/uuid-api-url',
      stringValue: `${api.url}/uuid`,
    });
  }
}
