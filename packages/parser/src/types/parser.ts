import type { ZodSchema, ZodError } from 'zod';
import type { Envelope } from './envelope.js';

type ParserOptions<S extends ZodSchema> = {
  schema: S;
  envelope?: Envelope;
  safeParse?: boolean;
};

type ParsedResultSuccess<Output> = {
  success: true;
  data: Output;
};

type ParsedResultError<Input> = {
  success: false;
  error: ZodError | Error;
  originalEvent: Input;
};

type ParsedResult<Input = unknown, Output = unknown> =
  | ParsedResultSuccess<Output>
  | ParsedResultError<Input>;

export type {
  ParserOptions,
  ParsedResult,
  ParsedResultError,
  ParsedResultSuccess,
};
