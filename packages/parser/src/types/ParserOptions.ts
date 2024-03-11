import type { ZodSchema } from 'zod';
import { Envelope } from './envelope.js';

export type ParserOptions<S extends ZodSchema> = {
  schema: S;
  envelope?: Envelope;
};
