import { ZodSchema, ZodError } from 'zod';
import { Envelope } from './envelope.js';

export type ParserOptions<S extends ZodSchema> = {
  schema: S;
  envelope?: Envelope;
  safeParse?: boolean;
};

export type ParsedResultSuccess<Output> = {
  success: true;
  data: Output;
};

export type ParsedResultError<Input> = {
  success: false;
  error: ZodError | Error;
  originalEvent: Input;
};

export type ParsedResult<Input = unknown, Output = unknown> =
  | ParsedResultSuccess<Output>
  | ParsedResultError<Input>;
