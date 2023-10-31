import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchProcessor, EventType } from '@aws-lambda-powertools/batch';
import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
import { SSMClient } from '@aws-sdk/client-ssm';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';

const logger = new Logger({
  logLevel: 'DEBUG',
});
const metrics = new Metrics();
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

// Instantiating the BatchProcessor will confirm that the utility can be used
new BatchProcessor(EventType.SQS);

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

export const handler = async (): Promise<void> => {
  // Check that the packages version matches the expected one
  for (const moduleName of [
    'commons',
    'logger',
    'metrics',
    'tracer',
    'parameters',
    'idempotency',
    'batch',
  ]) {
    const moduleVersion = await getVersionFromModule(moduleName);
    // TODO: remove this check once v2 becomes GA
    // if (moduleVersion != expectedVersion) {
    if (!moduleVersion.startsWith(expectedVersion)) {
      throw new Error(
        // `Package version mismatch (${moduleName}): ${moduleVersion} != ${expectedVersion}`
        `Package version mismatch (${moduleName}): ${moduleVersion} does not start with ${expectedVersion}`
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
};
