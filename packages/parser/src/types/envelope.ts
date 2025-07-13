import type { ZodType, z } from 'zod';
import type { envelopeDiscriminator } from '../envelopes/envelope.js';
import type { ParsedResult } from './parser.js';

type DynamoDBStreamEnvelopeResponse<T> = {
  NewImage?: z.infer<T>;
  OldImage?: z.infer<T>;
};

interface ArrayEnvelope {
  [envelopeDiscriminator]: 'array';
  parse<T>(data: unknown, schema: ZodType<T>): T[];
  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T[]>;
}

interface ObjectEnvelope {
  [envelopeDiscriminator]: 'object';
  parse<T>(data: unknown, schema: ZodType<T>): T;
  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T>;
}

type Envelope = ArrayEnvelope | ObjectEnvelope | undefined;

export type {
  ArrayEnvelope,
  DynamoDBStreamEnvelopeResponse,
  Envelope,
  ObjectEnvelope,
};
