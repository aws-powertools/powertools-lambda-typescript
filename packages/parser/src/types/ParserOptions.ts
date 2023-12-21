import type { ZodSchema } from 'zod';
import { Envelope } from './envelope.js';

interface ParserOptions<S extends ZodSchema> {
  schema: S;
  envelope?: Envelope;
}

export { type ParserOptions };
