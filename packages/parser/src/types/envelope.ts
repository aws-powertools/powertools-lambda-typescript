import type { ZodSchema, z } from 'zod';
import type { ParsedResult } from './parser.js';

type DynamoDBStreamEnvelopeResponse<Schema extends ZodSchema> = {
  NewImage: z.infer<Schema>;
  OldImage: z.infer<Schema>;
};

interface Envelope {
  symbol: 'array' | 'object';
  parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> | z.infer<T>[];
  safeParse<T extends ZodSchema>(data: unknown, schema: T): ParsedResult;
}

interface ArrayEnvelope extends Omit<Envelope, 'symbol'> {
  symbol: 'array';
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[];
  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]>;
}

interface ObjectEnvelope extends Omit<Envelope, 'symbol'> {
  symbol: 'object';
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>;
  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>>;
}

export type {
  ArrayEnvelope,
  DynamoDBStreamEnvelopeResponse,
  Envelope,
  ObjectEnvelope,
};
