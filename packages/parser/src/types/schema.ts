import type { z } from 'zod';
import type {
  APIGatewayEventRequestContextSchema,
  APIGatewayProxyEventSchema,
  APIGatewayProxyEventV2Schema,
  APIGatewayRequestAuthorizerEventSchema,
  APIGatewayRequestAuthorizerV2Schema,
  APIGatewayRequestContextV2Schema,
  APIGatewayTokenAuthorizerEventSchema,
  AlbMultiValueHeadersSchema,
  AlbSchema,
  AppSyncBatchResolverSchema,
  AppSyncResolverSchema,
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
  CloudWatchLogEventSchema,
  CloudWatchLogsDecodeSchema,
  CloudWatchLogsSchema,
  DynamoDBStreamSchema,
  DynamoDBStreamToKinesisRecord,
  EventBridgeSchema,
  KafkaMskEventSchema,
  KafkaRecordSchema,
  KafkaSelfManagedEventSchema,
  KinesisDataStreamRecord,
  KinesisDataStreamSchema,
  KinesisDynamoDBStreamSchema,
  KinesisFirehoseRecordSchema,
  KinesisFirehoseSchema,
  KinesisFirehoseSqsRecordSchema,
  KinesisFirehoseSqsSchema,
  LambdaFunctionUrlSchema,
  S3EventNotificationEventBridgeSchema,
  S3ObjectLambdaEventSchema,
  S3Schema,
  S3SqsEventNotificationSchema,
  SesRecordSchema,
  SesSchema,
  SnsNotificationSchema,
  SnsRecordSchema,
  SnsSchema,
  SnsSqsNotificationSchema,
  SqsRecordSchema,
  SqsSchema,
  TransferFamilySchema,
  VpcLatticeSchema,
  VpcLatticeV2Schema,
} from '../schemas/index.js';

type ALBEvent = z.infer<typeof AlbSchema>;

type ALBMultiValueHeadersEvent = z.infer<typeof AlbMultiValueHeadersSchema>;

type APIGatewayProxyEvent = z.infer<typeof APIGatewayProxyEventSchema>;

type APIGatewayRequestAuthorizerEvent = z.infer<
  typeof APIGatewayRequestAuthorizerEventSchema
>;

type APIGatewayTokenAuthorizerEvent = z.infer<
  typeof APIGatewayTokenAuthorizerEventSchema
>;

type APIGatewayEventRequestContext = z.infer<
  typeof APIGatewayEventRequestContextSchema
>;

type APIGatewayProxyEventV2 = z.infer<typeof APIGatewayProxyEventV2Schema>;

type APIGatewayRequestAuthorizerV2 = z.infer<
  typeof APIGatewayRequestAuthorizerV2Schema
>;

type APIGatewayRequestContextV2 = z.infer<
  typeof APIGatewayRequestContextV2Schema
>;

type AppSyncResolverEvent = z.infer<typeof AppSyncResolverSchema>;

type AppSyncBatchResolverEvent = z.infer<typeof AppSyncBatchResolverSchema>;

type CloudWatchLogEvent = z.infer<typeof CloudWatchLogEventSchema>;

type CloudWatchLogsDecode = z.infer<typeof CloudWatchLogsDecodeSchema>;

type CloudFormationCustomResourceCreateEvent = z.infer<
  typeof CloudFormationCustomResourceCreateSchema
>;

type CloudFormationCustomResourceDeleteEvent = z.infer<
  typeof CloudFormationCustomResourceDeleteSchema
>;

type CloudFormationCustomResourceUpdateEvent = z.infer<
  typeof CloudFormationCustomResourceUpdateSchema
>;

type CloudWatchLogsEvent = z.infer<typeof CloudWatchLogsSchema>;

type DynamoDBStreamEvent = z.infer<typeof DynamoDBStreamSchema>;

type DynamoDBStreamToKinesisRecordEvent = z.infer<
  typeof DynamoDBStreamToKinesisRecord
>;

type EventBridgeEvent = z.infer<typeof EventBridgeSchema>;

type KafkaSelfManagedEvent = z.infer<typeof KafkaSelfManagedEventSchema>;

type KafkaRecord = z.infer<typeof KafkaRecordSchema>;

type KafkaMskEvent = z.infer<typeof KafkaMskEventSchema>;

type KinesisDataStreamEvent = z.infer<typeof KinesisDataStreamSchema>;

type KinesisDynamoDBStreamEvent = z.infer<typeof KinesisDynamoDBStreamSchema>;

type KinesisDataStreamRecordEvent = z.infer<typeof KinesisDataStreamRecord>;

type KinesisFireHoseEvent = z.infer<typeof KinesisFirehoseSchema>;

type KinesisFirehoseRecord = z.infer<typeof KinesisFirehoseRecordSchema>;

type KinesisFireHoseSqsEvent = z.infer<typeof KinesisFirehoseSqsSchema>;

type KinesisFirehoseSqsRecord = z.infer<typeof KinesisFirehoseSqsRecordSchema>;

type LambdaFunctionUrlEvent = z.infer<typeof LambdaFunctionUrlSchema>;

type S3Event = z.infer<typeof S3Schema>;

type S3EventNotificationEventBridge = z.infer<
  typeof S3EventNotificationEventBridgeSchema
>;

type S3SqsEventNotification = z.infer<typeof S3SqsEventNotificationSchema>;

type S3ObjectLambdaEvent = z.infer<typeof S3ObjectLambdaEventSchema>;

type SesEvent = z.infer<typeof SesSchema>;

type SesRecord = z.infer<typeof SesRecordSchema>;

type SnsEvent = z.infer<typeof SnsSchema>;

type SnsSqsNotification = z.infer<typeof SnsSqsNotificationSchema>;

type SnsNotification = z.infer<typeof SnsNotificationSchema>;

type SnsRecord = z.infer<typeof SnsRecordSchema>;

type SqsEvent = z.infer<typeof SqsSchema>;

type SqsRecord = z.infer<typeof SqsRecordSchema>;

type TransferFamilyEvent = z.infer<typeof TransferFamilySchema>;

type VpcLatticeEvent = z.infer<typeof VpcLatticeSchema>;

type VpcLatticeEventV2 = z.infer<typeof VpcLatticeV2Schema>;

export type {
  ALBEvent,
  ALBMultiValueHeadersEvent,
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayRequestAuthorizerEvent,
  APIGatewayRequestAuthorizerV2,
  APIGatewayRequestContextV2,
  APIGatewayTokenAuthorizerEvent,
  AppSyncBatchResolverEvent,
  AppSyncResolverEvent,
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceDeleteEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudWatchLogEvent,
  CloudWatchLogsDecode,
  CloudWatchLogsEvent,
  DynamoDBStreamEvent,
  DynamoDBStreamToKinesisRecordEvent,
  EventBridgeEvent,
  KafkaMskEvent,
  KafkaRecord,
  KafkaSelfManagedEvent,
  KinesisDataStreamEvent,
  KinesisDataStreamRecordEvent,
  KinesisDynamoDBStreamEvent,
  KinesisFireHoseEvent,
  KinesisFireHoseSqsEvent,
  KinesisFirehoseRecord,
  KinesisFirehoseSqsRecord,
  LambdaFunctionUrlEvent,
  S3Event,
  S3EventNotificationEventBridge,
  S3ObjectLambdaEvent,
  S3SqsEventNotification,
  SesEvent,
  SesRecord,
  SnsEvent,
  SnsNotification,
  SnsRecord,
  SnsSqsNotification,
  SqsEvent,
  SqsRecord,
  TransferFamilyEvent,
  VpcLatticeEvent,
  VpcLatticeEventV2,
};
