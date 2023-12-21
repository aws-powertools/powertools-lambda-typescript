import type { ZodSchema } from 'zod';
import { Envelope } from './envelope.js';

type ParserOptions<S extends ZodSchema> = {
  schema: S;
  envelope?: Envelope;
};

export { type ParserOptions };
