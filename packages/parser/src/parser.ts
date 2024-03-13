import { ZodType } from 'zod';
import { Envelope } from 'src/types/index.js';
import { ParsedResult } from 'src/types/parser.js';

export const parse = <T extends ZodType, E extends Envelope>(
  data: unknown,
  envelope: E | undefined,
  schema: T,
  safeParse?: boolean
): ParsedResult<T> => {
  return safeParse
    ? envelope
      ? envelope(data, schema, safeParse)
      : schema.safeParse(data)
    : envelope
      ? envelope(data, schema)
      : schema.parse(data);
};
