import type { ZodType } from 'zod';
import type { envelopeDiscriminator } from '../envelopes/envelope.js';
import type { ParsedResult } from './parser.js';

type DynamoDBStreamEnvelopeResponse<T> = {
  NewImage?: T;
  OldImage?: T;
};

interface ArrayEnvelope {
  [envelopeDiscriminator]: 'array';
  parse<T>(data: unknown, schema: ZodType<T>): T[];
  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T[]>;
}

interface DynamoDBArrayEnvelope {
  [envelopeDiscriminator]: 'array';
  parse<T>(
    data: unknown,
    schema: ZodType<T>
  ): DynamoDBStreamEnvelopeResponse<T>[];
  safeParse<T>(
    data: unknown,
    schema: ZodType<T>
  ): ParsedResult<unknown, DynamoDBStreamEnvelopeResponse<T>[]>;
}

interface ObjectEnvelope {
  [envelopeDiscriminator]: 'object';
  parse<T>(data: unknown, schema: ZodType<T>): T;
  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T>;
}

type Envelope =
  | ArrayEnvelope
  | DynamoDBArrayEnvelope
  | ObjectEnvelope
  | undefined;

export type {
  ArrayEnvelope,
  DynamoDBArrayEnvelope,
  DynamoDBStreamEnvelopeResponse,
  Envelope,
  ObjectEnvelope,
};
