import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { LayerVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
  OutputFormat,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
// import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

const commonProps: Partial<NodejsFunctionProps> = {
  handler: 'handler',
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
};

export class CdkAppStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'Table', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        type: AttributeType.STRING,
        name: 'id',
      },
    });
    commonProps.environment!.SAMPLE_TABLE = table.tableName;

    const powertoolsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'powertools-layer',
      `arn:aws:lambda:${
        Stack.of(this).region
        //}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:2`
      }:536254204126:layer:Layers-E2E-20-x86-2a176-layerStack:1`
    );

    /**
     * In this example, we use ESM and bundle all the dependencies
     * including the AWS SDK.
     *
     * Because we are using ESM and tree shake, we create an optimized bundle.
     */
    const putItemFn = new NodejsFunction(this, 'put-item-fn', {
      ...commonProps,
      entry: './functions/put-item.ts',
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        format: OutputFormat.ESM, // we use create an ESM bundle
        sourcesContent: true,
        externalModules: [], // we bundle all the dependencies
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        // We include this polyfill to support `require` in ESM due to AWS X-Ray SDK for Node.js not being ESM compatible
        banner:
          'import { createRequire } from "module";const require = createRequire(import.meta.url);',
      },
    });
    putItemFn.addEnvironment('SAMPLE_TABLE', table.tableName);
    table.grantWriteData(putItemFn);

    /**
     * In this example, we instead use the Powertools layer to include Powertools
     * as well as the AWS SDK, this is a convenient way to use Powertools
     * in a centralized way across all your functions.
     */
    const getAllItemsFn = new NodejsFunction(this, 'get-all-items-fn', {
      ...commonProps,
      entry: './functions/get-all-items.ts',
      layers: [powertoolsLayer],
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        format: OutputFormat.ESM, // we use create an ESM bundle
        sourcesContent: true,
        externalModules: ['@aws-sdk/*', '@aws-lambda-powertools/*'], // the dependencies are included in the layer
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        // We include this polyfill to support `require` in ESM due to AWS X-Ray SDK for Node.js not being ESM compatible
        banner:
          'import { createRequire } from "module";const require = createRequire(import.meta.url);',
      },
    });
    getAllItemsFn.addEnvironment('SAMPLE_TABLE', table.tableName);
    table.grantReadData(getAllItemsFn);

    const getByIdFn = new NodejsFunction(this, 'get-by-id-fn', {
      ...commonProps,
      entry: './functions/get-by-id.ts',
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        format: OutputFormat.CJS, // we use create an CJS bundle
        sourcesContent: true,
        externalModules: [], // we bundle all the dependencies
      },
    });

    getByIdFn.addEnvironment('SAMPLE_TABLE', table.tableName);
    table.grantReadData(getByIdFn);

    // Create an API Gateway for the items service
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
