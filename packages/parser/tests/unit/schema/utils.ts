import { readFileSync } from 'node:fs';
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

  fileList.forEach((filename) => {
    Object.defineProperty(testEvents, filename, {
      get: () => JSON.parse(loadFileContent(filename)),
    });
  });

  return testEvents as TestEvents;
};

export const TestEvents = createTestEvents(filenames);
