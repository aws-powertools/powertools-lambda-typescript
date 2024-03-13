import { ZodSchema, ZodError, z } from 'zod';
import { Envelope } from './envelope.js';

export type ParserOptions<S extends ZodSchema> = {
  schema: S;
  envelope?: Envelope;
  safeParse?: boolean;
};

export type ParsedResultSuccess<S extends ZodSchema> = {
  success: true;
  data: z.infer<S>;
};

export type ParsedResultError = {
  success: false;
  error: ZodError | Error;
  originalEvent: unknown;
};

export type ParsedResult<S extends ZodSchema> =
  | ParsedResultSuccess<S>
  | ParsedResultError;
