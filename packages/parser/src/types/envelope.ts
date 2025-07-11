import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { envelopeDiscriminator } from '../envelopes/envelope.js';
import type { InferOutput, ParsedResult } from './parser.js';

type DynamoDBStreamEnvelopeResponse<Schema extends StandardSchemaV1> = {
  NewImage?: InferOutput<Schema>;
  OldImage?: InferOutput<Schema>;
};

interface ArrayEnvelope {
  [envelopeDiscriminator]: 'array';
  parse<T extends StandardSchemaV1>(data: unknown, schema: T): InferOutput<T>[];
  safeParse<T extends StandardSchemaV1>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, InferOutput<T>[]>;
}

interface ObjectEnvelope {
  [envelopeDiscriminator]: 'object';
  parse<T extends StandardSchemaV1>(data: unknown, schema: T): InferOutput<T>;
  safeParse<T extends StandardSchemaV1>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, InferOutput<T>>;
}

type Envelope = ArrayEnvelope | ObjectEnvelope | undefined;

export type {
  ArrayEnvelope,
  DynamoDBStreamEnvelopeResponse,
  Envelope,
  ObjectEnvelope,
};
