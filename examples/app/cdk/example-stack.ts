import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
  TableClass,
} from 'aws-cdk-lib/aws-dynamodb';
import {
  FilterCriteria,
  FilterRule,
  LayerVersion,
  StartingPosition,
} from 'aws-cdk-lib/aws-lambda';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';
import { FunctionWithLogGroup } from './function-with-logstream-construct.js';

export class PowertoolsExampleStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import Powertools layer to be used in some of the functions
    const powertoolsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'powertools-layer',
      `arn:aws:lambda:${
        Stack.of(this).region
      }:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:3`
    );

    // Items table
    const itemsTable = new Table(this, 'items-table', {
      tableName: 'powertools-example-items',
      tableClass: TableClass.STANDARD_INFREQUENT_ACCESS,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        type: AttributeType.STRING,
        name: 'id',
      },
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_IMAGE, // we use the stream to trigger the processItemsStreamFn
    });

    // Idempotency table
    const idempotencyTable = new Table(this, 'idempotencyTable', {
      tableName: 'powertools-example-idempotency',
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: 'expiration',
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // for demo only, change to RETAIN in production
    });

    /**
     * We will store the idempotency table name in a SSM parameter to simulate a potential
     * cross-stack reference. This is not strictly necessary in this example, but it's a good way of showing
     * how to use SSM parameters and retrieve them using Powertools.
     */
    const idempotencyTableNameParam = new StringParameter(
      this,
      'idempotency-table-name',
      {
        parameterName: '/items-store/idempotency-table-name',
        stringValue: idempotencyTable.tableName,
      }
    );

    /**
     * In this example, we use ESM and bundle all the dependencies
     * including the AWS SDK.
     *
     * Because we are using ESM and tree shake, we create an optimized bundle.
     */
    const putItemFn = new FunctionWithLogGroup(this, 'put-item-fn', {
      entry: './functions/put-item.ts',
      functionName: 'powertools-example-put-item',
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        format: OutputFormat.ESM,
        sourcesContent: true,
        mainFields: ['module', 'main'],
        externalModules: [], // we bundle all the dependencies
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        // We include this polyfill to support `require` in ESM due to AWS X-Ray SDK for Node.js not being ESM compatible
        banner:
          'import { createRequire } from "module";const require = createRequire(import.meta.url);',
      },
    });
    putItemFn.bindTable({ table: itemsTable, accessMode: 'RW' });
    /**
     * Allow the function to read and write to the idempotency table so it
     * can persist idempotency data
     */
    putItemFn.bindTable({
      table: idempotencyTable,
      accessOnly: true,
      accessMode: 'RW',
    });
    /**
     * Also allow the function to fetch the SSM parameter
     * that contains the idempotency table name
     */
    idempotencyTableNameParam.grantRead(putItemFn);
    putItemFn.addEnvironment(
      'SSM_PARAMETER_NAME',
      idempotencyTableNameParam.parameterName
    );

    /**
     * In this example, we instead use the Powertools layer to include Powertools
     * as well as the AWS SDK, this is a convenient way to use Powertools
     * in a centralized way across all your functions.
     */
    const getAllItemsFn = new FunctionWithLogGroup(this, 'get-all-items-fn', {
      entry: './functions/get-all-items.ts',
      functionName: 'powertools-example-get-all-items',
      layers: [powertoolsLayer], // we use the powertools layer
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        format: OutputFormat.ESM,
        mainFields: ['module', 'main'],
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
    getAllItemsFn.bindTable({ table: itemsTable });

    /**
     * In this examle, we emit a CommonJS (CJS) bundle and include all the
     * dependencies in it.
     */
    const getByIdFn = new FunctionWithLogGroup(this, 'get-by-id-fn', {
      entry: './functions/get-by-id.ts',
      functionName: 'powertools-example-get-by-id',
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        format: OutputFormat.CJS,
        mainFields: ['main'],
        sourcesContent: true,
        externalModules: [], // we bundle all the dependencies
      },
    });
    getByIdFn.bindTable({ table: itemsTable });

    /**
     * In this example, we use the Powertools layer to include Powertools
     * but we also bundle the function as CommonJS (CJS).
     */
    const processItemsStreamFn = new FunctionWithLogGroup(
      this,
      'process-items-stream-fn',
      {
        entry: './functions/process-items-stream.ts',
        functionName: 'powertools-example-process-items-stream',
        layers: [powertoolsLayer],
        bundling: {
          minify: true,
          sourceMap: true,
          keepNames: true,
          format: OutputFormat.CJS,
          mainFields: ['main'],
          sourcesContent: true,
          externalModules: ['@aws-sdk/*', '@aws-lambda-powertools/*'], // the dependencies are included in the layer
        },
      }
    );
    // Dead letter queue for the items that fail to be processed after the retry attempts
    const dlq = new Queue(this, 'dead-letter-queue', {
      queueName: 'powertools-example-dead-letter-queue',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    // Add the DynamoDB event source to the function
    processItemsStreamFn.addEventSource(
      new DynamoEventSource(itemsTable, {
        startingPosition: StartingPosition.LATEST,
        reportBatchItemFailures: true, // Enable batch failure reporting
        onFailure: new SqsDestination(dlq),
        batchSize: 100,
        retryAttempts: 3,
        filters: [
          // Filter by the INSERT event type and the presence of the id and name attributes
          FilterCriteria.filter({
            eventName: FilterRule.isEqual('INSERT'),
            dynamodb: {
              NewImage: {
                id: {
                  S: FilterRule.exists(),
                },
                name: {
                  S: FilterRule.exists(),
                },
              },
            },
          }),
        ],
      })
    );

    // Create an API Gateway to expose the items service
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
