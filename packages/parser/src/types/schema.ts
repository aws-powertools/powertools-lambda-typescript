import type { z } from 'zod';
import type {
  APIGatewayProxyEventSchema,
  APIGatewayProxyEventV2Schema,
  AlbMultiValueHeadersSchema,
  AlbSchema,
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
  CloudWatchLogsSchema,
  DynamoDBStreamSchema,
  EventBridgeSchema,
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
  KinesisDataStreamSchema,
  KinesisFirehoseSchema,
  KinesisFirehoseSqsSchema,
  LambdaFunctionUrlSchema,
  S3EventNotificationEventBridgeSchema,
  S3ObjectLambdaEventSchema,
  S3Schema,
  S3SqsEventNotificationSchema,
  SesSchema,
  SnsSchema,
  SqsSchema,
  VpcLatticeSchema,
  VpcLatticeV2Schema,
} from '../schemas/index.js';

type ALBEvent = z.infer<typeof AlbSchema>;

type ALBMultiValueHeadersEvent = z.infer<typeof AlbMultiValueHeadersSchema>;

type APIGatewayProxyEvent = z.infer<typeof APIGatewayProxyEventSchema>;

type APIGatewayProxyEventV2 = z.infer<typeof APIGatewayProxyEventV2Schema>;

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

type EventBridgeEvent = z.infer<typeof EventBridgeSchema>;

type KafkaSelfManagedEvent = z.infer<typeof KafkaSelfManagedEventSchema>;

type KafkaMskEvent = z.infer<typeof KafkaMskEventSchema>;

type KinesisDataStreamEvent = z.infer<typeof KinesisDataStreamSchema>;

type KinesisFireHoseEvent = z.infer<typeof KinesisFirehoseSchema>;

type KinesisFireHoseSqsEvent = z.infer<typeof KinesisFirehoseSqsSchema>;

type LambdaFunctionUrlEvent = z.infer<typeof LambdaFunctionUrlSchema>;

type S3Event = z.infer<typeof S3Schema>;

type S3EventNotificationEventBridge = z.infer<
  typeof S3EventNotificationEventBridgeSchema
>;

type S3SqsEventNotification = z.infer<typeof S3SqsEventNotificationSchema>;

type S3ObjectLambdaEvent = z.infer<typeof S3ObjectLambdaEventSchema>;

type SesEvent = z.infer<typeof SesSchema>;

type SnsEvent = z.infer<typeof SnsSchema>;

type SqsEvent = z.infer<typeof SqsSchema>;

type VpcLatticeEvent = z.infer<typeof VpcLatticeSchema>;

type VpcLatticeEventV2 = z.infer<typeof VpcLatticeV2Schema>;

export type {
  ALBEvent,
  ALBMultiValueHeadersEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceDeleteEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudWatchLogsEvent,
  DynamoDBStreamEvent,
  EventBridgeEvent,
  KafkaSelfManagedEvent,
  KafkaMskEvent,
  KinesisDataStreamEvent,
  KinesisFireHoseEvent,
  KinesisFireHoseSqsEvent,
  LambdaFunctionUrlEvent,
  S3Event,
  S3EventNotificationEventBridge,
  S3SqsEventNotification,
  S3ObjectLambdaEvent,
  SesEvent,
  SnsEvent,
  SqsEvent,
  VpcLatticeEvent,
  VpcLatticeEventV2,
};
