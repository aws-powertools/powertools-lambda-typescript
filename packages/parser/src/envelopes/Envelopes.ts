import { ApiGatewayEnvelope } from './apigw.js';
import { ApiGatwayV2Envelope } from './apigwv2.js';
import { CloudWatchEnvelope } from './cloudwatch.js';
import { KafkaEnvelope } from './kafka.js';
import { SqsEnvelope } from './sqs.js';
import { EventBridgeEnvelope } from './eventBridgeEnvelope.js';
import { KinesisFirehoseEnvelope } from './kinesis-firehose.js';
import { LambdaFunctionUrlEnvelope } from './lambda.js';
import { SnsEnvelope, SnsSqsEnvelope } from './sns.js';
import { VpcLatticeEnvelope } from './vpc-lattice.js';
import { VpcLatticeV2Envelope } from './vpc-latticev2.js';
import { DynamoDBStreamEnvelope } from './dynamodb.js';
import { KinesisEnvelope } from './kinesis.js';

/**
 * A collection of envelopes to create new envelopes.
 */
export class Envelopes {
  public static readonly API_GW_ENVELOPE = new ApiGatewayEnvelope();
  public static readonly API_GW_V2_ENVELOPE = new ApiGatwayV2Envelope();
  public static readonly CLOUDWATCH_ENVELOPE = new CloudWatchEnvelope();
  public static readonly DYNAMO_DB_STREAM_ENVELOPE =
    new DynamoDBStreamEnvelope();
  public static readonly EVENT_BRIDGE_ENVELOPE = new EventBridgeEnvelope();
  public static readonly KAFKA_ENVELOPE = new KafkaEnvelope();
  public static readonly KINESIS_ENVELOPE = new KinesisEnvelope();
  public static readonly KINESIS_FIREHOSE_ENVELOPE =
    new KinesisFirehoseEnvelope();
  public static readonly LAMBDA_FUCTION_URL_ENVELOPE =
    new LambdaFunctionUrlEnvelope();
  public static readonly SNS_ENVELOPE = new SnsEnvelope();
  public static readonly SNS_SQS_ENVELOPE = new SnsSqsEnvelope();
  public static readonly SQS_ENVELOPE = new SqsEnvelope();
  public static readonly VPC_LATTICE_ENVELOPE = new VpcLatticeEnvelope();
  public static readonly VPC_LATTICE_V2_ENVELOPE = new VpcLatticeV2Envelope();
}
