import {
  KafkaSelfManagedEventSchema,
  KafkaMskEventSchema,
} from '../schemas/kafka.js';
import { z } from 'zod';
import {
  KinesisDataStreamRecord,
  KinesisDataStreamRecordPayload,
  KinesisDataStreamSchema,
} from '../schemas/kinesis.js';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';
import { AlbSchema, AlbMultiValueHeadersSchema } from '../schemas/alb.js';
import { APIGatewayProxyEventV2Schema } from '../schemas/apigwv2.js';
import { DynamoDBStreamSchema } from '../schemas/dynamodb.js';
import { SqsSchema } from '../schemas/sqs.js';
import {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
} from '../schemas/cloudformation-custom-resource.js';
import { CloudWatchLogsSchema } from '../schemas/cloudwatch.js';
import { EventBridgeSchema } from '../schemas/eventbridge.js';
import {
  KinesisFirehoseSchema,
  KinesisFirehoseSqsSchema,
} from '../schemas/kinesis-firehose.js';
import { LambdaFunctionUrlSchema } from '../schemas/lambda.js';
import {
  S3EventNotificationEventBridgeSchema,
  S3Schema,
  S3SqsEventNotificationSchema,
} from '../schemas/s3.js';
import { SesSchema } from '../schemas/ses.js';
import { SnsSchema } from '../schemas/sns.js';
import { VpcLatticeSchema } from '../schemas/vpc-lattice.js';
import { VpcLatticeV2Schema } from '../schemas/vpc-latticev2.js';

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

type SesEvent = z.infer<typeof SesSchema>;

type SnsEvent = z.infer<typeof SnsSchema>;

type SqsEvent = z.infer<typeof SqsSchema>;

type VpcLatticeEvent = z.infer<typeof VpcLatticeSchema>;

type VpcLatticeEventV2 = z.infer<typeof VpcLatticeV2Schema>;

export {
  type ALBEvent,
  type ALBMultiValueHeadersEvent,
  type APIGatewayProxyEvent,
  type APIGatewayProxyEventV2,
  type CloudFormationCustomResourceCreateEvent,
  type CloudFormationCustomResourceDeleteEvent,
  type CloudFormationCustomResourceUpdateEvent,
  type CloudWatchLogsEvent,
  type DynamoDBStreamEvent,
  type EventBridgeEvent,
  type KafkaSelfManagedEvent,
  type KafkaMskEvent,
  type KinesisDataStreamEvent,
  type KinesisDataStreamRecord,
  type KinesisDataStreamRecordPayload,
  type KinesisFireHoseEvent,
  type KinesisFireHoseSqsEvent,
  type LambdaFunctionUrlEvent,
  type S3Event,
  type S3EventNotificationEventBridge,
  type S3SqsEventNotification,
  type SesEvent,
  type SnsEvent,
  type SqsEvent,
  type VpcLatticeEvent,
  type VpcLatticeEventV2,
};
