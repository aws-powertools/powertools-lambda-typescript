import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import type { ParsedResult } from '../types/parser.js';

const Envelope = {
  /**
   * Abstract function to parse the content of the envelope using provided schema.
   * Both inputs are provided as unknown by the user.
   * We expect the data to be either string that can be parsed to json or object.
   * @internal
   * @param data data to parse
   * @param schema schema
   */
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    if (typeof data !== 'object' && typeof data !== 'string') {
      throw new ParseError(
        `Invalid data type for envelope. Expected string or object, got ${typeof data}`
      );
    }
    try {
      if (typeof data === 'string') {
        return schema.parse(JSON.parse(data));
      }
      if (typeof data === 'object') {
        return schema.parse(data);
      }
    } catch (e) {
      throw new ParseError('Failed to parse envelope', { cause: e as Error });
    }
  },

  /**
   * Abstract function to safely parse the content of the envelope using provided schema.
   * safeParse is used to avoid throwing errors, thus we catuch all errors and wrap them in the result.
   * @param input
   * @param schema
   */
  safeParse<T extends ZodSchema>(input: unknown, schema: T): ParsedResult {
    try {
      if (typeof input !== 'object' && typeof input !== 'string') {
        return {
          success: false,
          error: new Error(
            `Invalid data type for envelope. Expected string or object, got ${typeof input}`
          ),
        };
      }

      const parsed = schema.safeParse(
        typeof input === 'string' ? JSON.parse(input) : input
      );

      return parsed.success
        ? {
            success: true,
            data: parsed.data,
          }
        : {
            success: false,
            error: parsed.error,
          };
    } catch (e) {
      return {
        success: false,
        error: e as Error,
      };
    }
  },
};

/**
 * This is a discriminator to differentiate whether an envelope returns an array or an object
 * @hidden
 */
const envelopeDiscriminator = Symbol.for('returnType');

export { Envelope, envelopeDiscriminator };
