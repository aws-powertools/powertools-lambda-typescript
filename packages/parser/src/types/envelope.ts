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
import { z, type ZodSchema } from 'zod';

type DynamoDBStreamEnvelopeResponse<Schema extends ZodSchema> = {
  NewImage: z.infer<Schema>;
  OldImage: z.infer<Schema>;
};

type Envelope =
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
  | typeof VpcLatticeV2Envelope
  | undefined;

/**
 * Envelopes that return an array, needed to narrow down the return type of the parser
 */
type EnvelopeArrayReturnType =
  | typeof CloudWatchEnvelope
  | typeof DynamoDBStreamEnvelope
  | typeof KafkaEnvelope
  | typeof KinesisEnvelope
  | typeof KinesisFirehoseEnvelope
  | typeof SnsEnvelope
  | typeof SqsEnvelope;

export type {
  Envelope,
  DynamoDBStreamEnvelopeResponse,
  EnvelopeArrayReturnType,
};
