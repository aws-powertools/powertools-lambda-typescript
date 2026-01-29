import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BatchProcessor, EventType } from '@aws-lambda-powertools/batch';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SSMClient } from '@aws-sdk/client-ssm';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  logLevel: 'DEBUG',
});
const metrics = new Metrics({ logger });
const tracer = new Tracer();

// Instantiating these clients and the respective providers/persistence layers
// will ensure that Idempotency & Parameters are working with
// the AWS SDK v3 client, both coming from the Lambda Layer and the
// bundle
const ddbClient = new DynamoDBClient({});

const ssmClient = new SSMClient({});

const secretsClient = new SecretsManagerClient({});

const appconfigClient = new AppConfigDataClient({});

new DynamoDBPersistenceLayer({
  tableName: 'my-idempotency-table',
  awsSdkV3Client: ddbClient,
});

new SSMProvider({ awsSdkV3Client: ssmClient });

new SecretsProvider({ awsSdkV3Client: secretsClient });

new AppConfigProvider({ environment: 'foo', awsSdkV3Client: appconfigClient });

new DynamoDBProvider({ tableName: 'foo', awsSdkV3Client: ddbClient });

new BatchProcessor(EventType.SQS);

const app = new Router({
  logger: { error: () => {}, debug: () => {}, info: () => {}, warn: () => {} },
});

const layerPath = process.env.LAYERS_PATH || '/opt/nodejs/node_modules';
const expectedVersion = process.env.POWERTOOLS_PACKAGE_VERSION || '0.0.0';

const getVersionFromModule = async (moduleName: string): Promise<string> => {
  const manifestPath = join(
    layerPath,
    '@aws-lambda-powertools',
    moduleName,
    'package.json'
  );

  let manifest: string;
  try {
    manifest = await readFile(manifestPath, { encoding: 'utf8' });
  } catch (error) {
    console.log(error);
    throw new Error(`Unable to read/find package.json file at ${manifestPath}`);
  }

  let moduleVersion: string;
  try {
    const { version } = JSON.parse(manifest);
    moduleVersion = version;
  } catch (error) {
    console.log(error);
    throw new Error(`Unable to parse package.json file at ${manifestPath}`);
  }

  return moduleVersion;
};

export const handler = async (_event: unknown, context: Context) => {
  // Check that the packages version matches the expected one
  for (const moduleName of [
    'commons',
    'logger',
    'metrics',
    'tracer',
    'parameters',
    'idempotency',
    'batch',
    'parser',
    'event-handler',
  ]) {
    const moduleVersion = await getVersionFromModule(moduleName);
    if (moduleVersion !== expectedVersion) {
      throw new Error(
        `Package version mismatch (${moduleName}): ${moduleVersion} != ${expectedVersion}`
      );
    }
  }

  // Check that the metrics is working
  metrics.captureColdStartMetric();

  // Check that the tracer is working
  const subsegment = tracer.getSegment()?.addNewSubsegment('### index.handler');
  if (!subsegment) {
    throw new Error('Unable to create subsegment, check the Tracer');
  }
  tracer.setSegment(subsegment);
  tracer.annotateColdStart();
  subsegment.close();
  tracer.setSegment(subsegment.parent);

  // Check that logger & tracer are both working
  // the presence of a log will indicate that the logger is working
  // while the content of the log will indicate that the tracer is working
  logger.debug('subsegment', { subsegment: subsegment.format() });

  // Since we're passing an invalid event, the event handler will throw
  // an InvalidEventError. This will prove that the event-handler layer
  // is working as expected without us having to resolve a full event
  try {
    await app.resolve({}, context);
  } catch (error) {
    if ((error as Error).name !== 'InvalidEventError') {
      throw error;
    }
  }
};
