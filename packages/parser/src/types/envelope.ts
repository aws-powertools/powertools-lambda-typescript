import { type apiGatewayEnvelope } from '../envelopes/apigw.js';
import { type apiGatewayV2Envelope } from '../envelopes/apigwv2.js';
import { type cloudWatchEnvelope } from '../envelopes/cloudwatch.js';
import { type dynamoDDStreamEnvelope } from '../envelopes/dynamodb.js';
import { type kafkaEnvelope } from '../envelopes/kafka.js';
import { type kinesisEnvelope } from '../envelopes/kinesis.js';
import { type kinesisFirehoseEnvelope } from '../envelopes/kinesis-firehose.js';
import { type lambdaFunctionUrlEnvelope } from '../envelopes/lambda.js';
import { type snsEnvelope } from '../envelopes/sns.js';
import { type snsSqsEnvelope } from '../envelopes/sns.js';
import { type sqsEnvelope } from '../envelopes/sqs.js';
import { type vpcLatticeEnvelope } from '../envelopes/vpc-lattice.js';
import { type vpcLatticeV2Envelope } from '../envelopes/vpc-latticev2.js';
import { type eventBridgeEnvelope } from '../envelopes/event-bridge.js';

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
