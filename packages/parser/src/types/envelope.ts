import { apiGatewayEnvelope } from '../envelopes/apigw.js';
import { apiGatewayV2Envelope } from '../envelopes/apigwv2.js';
import { cloudWatchEnvelope } from '../envelopes/cloudwatch.js';
import { dynamoDDStreamEnvelope } from '../envelopes/dynamodb.js';
import { kafkaEnvelope } from '../envelopes/kafka.js';
import { kinesisEnvelope } from '../envelopes/kinesis.js';
import { kinesisFirehoseEnvelope } from '../envelopes/kinesis-firehose.js';
import { lambdaFunctionUrlEnvelope } from '../envelopes/lambda.js';
import { snsEnvelope } from '../envelopes/sns.js';
import { snsSqsEnvelope } from '../envelopes/sns.js';
import { sqsEnvelope } from '../envelopes/sqs.js';
import { vpcLatticeEnvelope } from '../envelopes/vpc-lattice.js';
import { vpcLatticeV2Envelope } from '../envelopes/vpc-latticev2.js';
import { eventBridgeEnvelope } from '../envelopes/event-bridge.js';

export type Envelope =
  | typeof apiGatewayEnvelope
  | typeof apiGatewayV2Envelope
  | typeof cloudWatchEnvelope
  | typeof dynamoDDStreamEnvelope
  | typeof eventBridgeEnvelope
  | typeof kafkaEnvelope
  | typeof kinesisEnvelope
  | typeof kinesisFirehoseEnvelope
  | typeof lambdaFunctionUrlEnvelope
  | typeof snsEnvelope
  | typeof snsSqsEnvelope
  | typeof sqsEnvelope
  | typeof vpcLatticeEnvelope
  | typeof vpcLatticeV2Envelope;
