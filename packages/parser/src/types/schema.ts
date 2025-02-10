import type { z } from 'zod';
import type {
  APIGatewayProxyEventSchema,
  APIGatewayProxyEventV2Schema,
  APIGatewayRequestAuthorizerV2Schema,
  APIGatewayRequestContextV2Schema,
  AlbMultiValueHeadersSchema,
  AlbSchema,
  AppSyncBatchResolverSchema,
  AppSyncResolverSchema,
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
  CloudWatchLogsSchema,
  DynamoDBStreamSchema,
  DynamoDBStreamToKinesisRecord,
  EventBridgeSchema,
  KafkaMskEventSchema,
  KafkaRecordSchema,
  KafkaSelfManagedEventSchema,
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

type APIGatewayProxyEventV2 = z.infer<typeof APIGatewayProxyEventV2Schema>;

type APIGatewayRequestAuthorizerV2 = z.infer<
  typeof APIGatewayRequestAuthorizerV2Schema
>;

type APIGatewayRequestContextV2 = z.infer<
  typeof APIGatewayRequestContextV2Schema
>;

type AppSyncResolverEvent = z.infer<typeof AppSyncResolverSchema>;

type AppSyncBatchResolverEvent = z.infer<typeof AppSyncBatchResolverSchema>;

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
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayRequestAuthorizerV2,
  APIGatewayRequestContextV2,
  AppSyncResolverEvent,
  AppSyncBatchResolverEvent,
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceDeleteEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudWatchLogsEvent,
  DynamoDBStreamEvent,
  DynamoDBStreamToKinesisRecordEvent,
  EventBridgeEvent,
  KafkaSelfManagedEvent,
  KafkaMskEvent,
  KafkaRecord,
  KinesisDataStreamEvent,
  KinesisDynamoDBStreamEvent,
  KinesisFireHoseEvent,
  KinesisFirehoseRecord,
  KinesisFireHoseSqsEvent,
  KinesisFirehoseSqsRecord,
  LambdaFunctionUrlEvent,
  S3Event,
  S3EventNotificationEventBridge,
  S3SqsEventNotification,
  S3ObjectLambdaEvent,
  SesEvent,
  SesRecord,
  SnsEvent,
  SnsSqsNotification,
  SnsNotification,
  SnsRecord,
  SqsEvent,
  SqsRecord,
  TransferFamilyEvent,
  VpcLatticeEvent,
  VpcLatticeEventV2,
};
