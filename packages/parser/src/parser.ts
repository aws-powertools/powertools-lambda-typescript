import type { ParsedResult, Envelope } from './types/index.js';
import { z, type ZodSchema } from 'zod';

/**
 * Parse the data using the provided schema, envelope and safeParse flag
 * @param data the data to parse
 * @param envelope the envelope to use, can be undefined
 * @param schema the schema to use
 * @param safeParse whether to use safeParse or not, if true it will return a ParsedResult with the original event if the parsing fails
 */
export const parse = <T extends ZodSchema, E extends Envelope>(
  data: z.infer<T>,
  envelope: E | undefined,
  schema: T,
  safeParse?: boolean
): ParsedResult => {
  return safeParse
    ? envelope
      ? envelope.safeParse(data, schema)
      : safeParseSchema(data, schema)
    : envelope
      ? envelope.parse(data, schema)
      : schema.parse(data);
};

const safeParseSchema = <T extends ZodSchema>(
  data: z.infer<T>,
  schema: T
): ParsedResult => {
  const result = schema.safeParse(data);

  return result.success
    ? result
    : { success: false, error: result.error, originalEvent: data };
};
