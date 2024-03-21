import type {
  ApiGatewayEnvelope,
  KinesisFirehoseEnvelope,
  KinesisEnvelope,
  KafkaEnvelope,
  CloudWatchEnvelope,
  EventBridgeEnvelope,
  ApiGatewayV2Envelope,
  DynamoDBStreamEnvelope,
  LambdaFunctionUrlEnvelope,
  SnsEnvelope,
  SnsSqsEnvelope,
  SqsEnvelope,
  VpcLatticeEnvelope,
  VpcLatticeV2Envelope,
} from '../envelopes/index.js';

export type Envelope =
  | ApiGatewayEnvelope
  | ApiGatewayV2Envelope
  | CloudWatchEnvelope
  | DynamoDBStreamEnvelope
  | EventBridgeEnvelope
  | KafkaEnvelope
  | KinesisEnvelope
  | KinesisFirehoseEnvelope
  | LambdaFunctionUrlEnvelope
  | SnsEnvelope
  | SnsSqsEnvelope
  | SqsEnvelope
  | VpcLatticeEnvelope
  | VpcLatticeV2Envelope;
