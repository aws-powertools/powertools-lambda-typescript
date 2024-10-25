import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const TestSchema = z.object({
  name: z.string(),
  age: z.number().min(18).max(99),
});

const filenames = [
  'activeMQEvent',
  'albEvent',
  'albEventPathTrailingSlash',
  'albMultiValueHeadersEvent',
  'apiGatewayAuthorizerRequestEvent',
  'apiGatewayAuthorizerTokenEvent',
  'apiGatewayAuthorizerV2Event',
  'apiGatewayProxyEvent',
  'apiGatewayProxyEventAnotherPath',
  'apiGatewayProxyEventPathTrailingSlash',
  'apiGatewayProxyEventPrincipalId',
  'apiGatewayProxyEvent_noVersionAuth',
  'apiGatewayProxyOtherEvent',
  'apiGatewayProxyEventTestUI',
  'apiGatewayProxyV2Event',
  'apiGatewayProxyV2EventPathTrailingSlash',
  'apiGatewayProxyV2Event_GET',
  'apiGatewayProxyV2IamEvent',
  'apiGatewayProxyV2LambdaAuthorizerEvent',
  'apiGatewayProxyV2OtherGetEvent',
  'apiGatewayProxyV2SchemaMiddlewareInvalidEvent',
  'apiGatewayProxyV2SchemaMiddlewareValidEvent',
  'apiGatewaySchemaMiddlewareInvalidEvent',
  'apiGatewaySchemaMiddlewareValidEvent',
  'appSyncAuthorizerEvent',
  'appSyncAuthorizerResponse',
  'appSyncDirectResolver',
  'appSyncResolverEvent',
  'awsConfigRuleConfigurationChanged',
  'awsConfigRuleOversizedConfiguration',
  'awsConfigRuleScheduled',
  'bedrockAgentEvent',
  'bedrockAgentPostEvent',
  'cloudFormationCustomResourceCreateEvent',
  'cloudFormationCustomResourceDeleteEvent',
  'cloudFormationCustomResourceUpdateEvent',
  'cloudWatchDashboardEvent',
  'cloudWatchLogEvent',
  'codePipelineEvent',
  'codePipelineEventData',
  'codePipelineEventEmptyUserParameters',
  'codePipelineEventWithEncryptionKey',
  'cognitoCreateAuthChallengeEvent',
  'cognitoCustomMessageEvent',
  'cognitoDefineAuthChallengeEvent',
  'cognitoPostAuthenticationEvent',
  'cognitoPostConfirmationEvent',
  'cognitoPreAuthenticationEvent',
  'cognitoPreSignUpEvent',
  'cognitoPreTokenGenerationEvent',
  'cognitoUserMigrationEvent',
  'cognitoVerifyAuthChallengeResponseEvent',
  'connectContactFlowEventAll',
  'connectContactFlowEventMin',
  'dynamoStreamEvent',
  'eventBridgeEvent',
  'kafkaEventMsk',
  'kafkaEventSelfManaged',
  'kinesisFirehoseKinesisEvent',
  'kinesisFirehosePutEvent',
  'kinesisFirehoseSQSEvent',
  'kinesisStreamCloudWatchLogsEvent',
  'kinesisStreamEvent',
  'kinesisStreamEventOneRecord',
  'lambdaFunctionUrlEvent',
  'lambdaFunctionUrlEventPathTrailingSlash',
  'lambdaFunctionUrlIAMEvent',
  'rabbitMQEvent',
  's3Event',
  's3EventBridgeNotificationObjectCreatedEvent',
  's3EventBridgeNotificationObjectDeletedEvent',
  's3EventBridgeNotificationObjectExpiredEvent',
  's3EventBridgeNotificationObjectRestoreCompletedEvent',
  's3EventDecodedKey',
  's3EventDeleteObject',
  's3EventDeleteObjectWithoutEtagSize',
  's3EventGlacier',
  's3ObjectEventIAMUser',
  's3ObjectEventTempCredentials',
  's3SqsEvent',
  'secretsManagerEvent',
  'sesEvent',
  'snsEvent',
  'snsSqsEvent',
  'snsSqsFifoEvent',
  'sqsEvent',
  'vpcLatticeEvent',
  'vpcLatticeEventPathTrailingSlash',
  'vpcLatticeEventV2PathTrailingSlash',
  'vpcLatticeV2Event',
] as const;

type TestEvents = { [K in (typeof filenames)[number]]: unknown };
const loadFileContent = (filename: string): string =>
  readFileSync(`./tests/events/${filename}.json`, 'utf-8');

const createTestEvents = (fileList: readonly string[]): TestEvents => {
  const testEvents: Partial<TestEvents> = {};

  for (const filename of fileList) {
    Object.defineProperty(testEvents, filename, {
      get: () => JSON.parse(loadFileContent(filename)),
    });
  }

  return testEvents as TestEvents;
};

export const TestEvents = createTestEvents(filenames);

export const getTestEvent = <T extends Record<string, unknown>>({
  eventsPath,
  filename,
}: {
  eventsPath: string;
  filename: string;
}): T =>
  JSON.parse(
    readFileSync(
      join(__dirname, '..', '..', 'events', eventsPath, `${filename}.json`),
      'utf-8'
    )
  ) as T;

type ZodShape = { [k: string]: z.ZodTypeAny };

/**
 * Creates a strict version of a schema for testing purposes without modifying the original
 */
export const makeSchemaStrictForTesting = <T extends z.ZodTypeAny>(
  schema: T
): T => {
  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape() as ZodShape;
    const newShape = Object.fromEntries(
      Object.entries(shape).map(([key, value]) => [
        key,
        makeSchemaStrictForTesting(value),
      ])
    );

    return z.object(newShape).strict() as unknown as T;
  }

  if (schema instanceof z.ZodArray) {
    const elementSchema = schema.element;
    return z.array(makeSchemaStrictForTesting(elementSchema)) as unknown as T;
  }

  if (schema instanceof z.ZodUnion) {
    const options = schema._def.options as readonly [
      z.ZodTypeAny,
      z.ZodTypeAny,
      ...z.ZodTypeAny[],
    ];
    const newOptions = options.map((option) =>
      makeSchemaStrictForTesting(option)
    );
    // Ensure we have at least two elements for the union
    return z.union([
      newOptions[0],
      newOptions[1],
      ...newOptions.slice(2),
    ]) as unknown as T;
  }

  if (schema instanceof z.ZodRecord) {
    const keySchema = schema.keySchema;
    const valueSchema = schema.valueSchema;
    return z.record(
      makeSchemaStrictForTesting(keySchema),
      makeSchemaStrictForTesting(valueSchema)
    ) as unknown as T;
  }

  // Handle extended schemas
  if (schema instanceof z.ZodObject && schema._def.shape instanceof Function) {
    const shape = schema._def.shape() as ZodShape;
    const newShape = Object.fromEntries(
      Object.entries(shape).map(([key, value]) => [
        key,
        makeSchemaStrictForTesting(value),
      ])
    );

    return z.object(newShape).strict() as unknown as T;
  }

  // Return other types as-is
  return schema;
};
