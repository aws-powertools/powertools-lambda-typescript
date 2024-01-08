import {
  KafkaRecordSchema,
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
import {
  CloudWatchLogsSchema,
  CloudWatchLogEventSchema,
} from '../schemas/cloudwatch.js';
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
import { SesSchema, SesRecordSchema } from '../schemas/ses.js';
import {
  SnsSchema,
  SnsRecordSchema,
  SnsNotificationSchema,
  SnsSqsNotificationSchema,
} from '../schemas/sns.js';
import { VpcLatticeSchema } from '../schemas/vpc-lattice.js';
import { VpcLatticeV2Schema } from '../schemas/vpc-latticev2.js';

type Alb = z.infer<typeof AlbSchema>;

type AlbMultiValueHeaders = z.infer<typeof AlbMultiValueHeadersSchema>;

type APIGatewayProxyEvent = z.infer<typeof APIGatewayProxyEventSchema>;
type APIGatewayProxyEventV2 = z.infer<typeof APIGatewayProxyEventV2Schema>;

type CloudFormationCustomResourceCreate = z.infer<
  typeof CloudFormationCustomResourceCreateSchema
>;

type CloudFormationCustomResourceDelete = z.infer<
  typeof CloudFormationCustomResourceDeleteSchema
>;

type CloudFormationCustomResourceUpdate = z.infer<
  typeof CloudFormationCustomResourceUpdateSchema
>;

type CloudWatchLogs = z.infer<typeof CloudWatchLogsSchema>;

type CloudWatchLogsEvent = z.infer<typeof CloudWatchLogEventSchema>;

type DynamoDBStream = z.infer<typeof DynamoDBStreamSchema>;

type EventBridge = z.infer<typeof EventBridgeSchema>;

type KafkaRecord = z.infer<typeof KafkaRecordSchema>;

type KafkaSelfManagedEvent = z.infer<typeof KafkaSelfManagedEventSchema>;

type KafkaMskEvent = z.infer<typeof KafkaMskEventSchema>;

type KinesisDataStream = z.infer<typeof KinesisDataStreamSchema>;

type KinesisDataStreamRecord = z.infer<typeof KinesisDataStreamRecord>;

type KinesisDataStreamRecordPayload = z.infer<
  typeof KinesisDataStreamRecordPayload
>;

type KinesisFireHose = z.infer<typeof KinesisFirehoseSchema>;

type KinesisFireHoseSqs = z.infer<typeof KinesisFirehoseSqsSchema>;

type LambdaFunctionUrl = z.infer<typeof LambdaFunctionUrlSchema>;

type S3 = z.infer<typeof S3Schema>;

type S3EventNotificationEventBridge = z.infer<
  typeof S3EventNotificationEventBridgeSchema
>;

type S3SqsEventNotification = z.infer<typeof S3SqsEventNotificationSchema>;

type Ses = z.infer<typeof SesSchema>;

type SesRecord = z.infer<typeof SesRecordSchema>;

type Sns = z.infer<typeof SnsSchema>;

type SnsRecord = z.infer<typeof SnsRecordSchema>;

type SnsNotification = z.infer<typeof SnsNotificationSchema>;

type SnsSqsNotification = z.infer<typeof SnsSqsNotificationSchema>;

type Sqs = z.infer<typeof SqsSchema>;

type VpcLattice = z.infer<typeof VpcLatticeSchema>;

type VpcLatticeV2 = z.infer<typeof VpcLatticeV2Schema>;

export {
  type Alb,
  type AlbMultiValueHeaders,
  type APIGatewayProxyEvent,
  type APIGatewayProxyEventV2,
  type CloudFormationCustomResourceCreate,
  type CloudFormationCustomResourceDelete,
  type CloudFormationCustomResourceUpdate,
  type CloudWatchLogs,
  type CloudWatchLogsEvent,
  type DynamoDBStream,
  type EventBridge,
  type KafkaSelfManagedEvent,
  type KafkaMskEvent,
  type KinesisDataStream,
  type KinesisDataStreamRecord,
  type KinesisDataStreamRecordPayload,
  type KinesisFireHose,
  type KinesisFireHoseSqs,
  type LambdaFunctionUrl,
  type S3,
  type S3EventNotificationEventBridge,
  type S3SqsEventNotification,
  type Ses,
  type SesRecord,
  type Sns,
  type SnsRecord,
  type SnsNotification,
  type SnsSqsNotification,
  type Sqs,
  type VpcLattice,
  type VpcLatticeV2,
  type KafkaRecord,
};
