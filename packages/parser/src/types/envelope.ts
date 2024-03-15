import {
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
  | typeof ApiGatewayEnvelope
  | typeof ApiGatewayV2Envelope
  | typeof CloudWatchEnvelope
  | typeof DynamoDBStreamEnvelope
  | typeof EventBridgeEnvelope
  | typeof KafkaEnvelope
  | typeof KinesisEnvelope
  | typeof KinesisFirehoseEnvelope
  | typeof LambdaFunctionUrlEnvelope
  | typeof SnsEnvelope
  | typeof SnsSqsEnvelope
  | typeof SqsEnvelope
  | typeof VpcLatticeEnvelope
  | typeof VpcLatticeV2Envelope;
