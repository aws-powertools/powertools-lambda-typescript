import type { ZodSchema, z } from 'zod';
import type { envelopeDiscriminator } from '../envelopes/envelope.js';
import type { ParsedResult } from './parser.js';

type DynamoDBStreamEnvelopeResponse<Schema extends ZodSchema> = {
  NewImage?: z.infer<Schema>;
  OldImage?: z.infer<Schema>;
};

interface ArrayEnvelope {
  [envelopeDiscriminator]: 'array';
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[];
  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]>;
}

interface ObjectEnvelope {
  [envelopeDiscriminator]: 'object';
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>;
  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>>;
}

type Envelope = ArrayEnvelope | ObjectEnvelope | undefined;

export type {
  ArrayEnvelope,
  DynamoDBStreamEnvelopeResponse,
  Envelope,
  ObjectEnvelope,
};
