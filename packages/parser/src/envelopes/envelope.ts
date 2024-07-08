import { z, type ZodSchema } from 'zod';
import type { ParsedResult } from '../types/parser.js';
import { ParseError } from '../errors.js';

export class Envelope {
  /**
   * Abstract function to parse the content of the envelope using provided schema.
   * Both inputs are provided as unknown by the user.
   * We expect the data to be either string that can be parsed to json or object.
   * @internal
   * @param data data to parse
   * @param schema schema
   */
  public static readonly parse = <T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> => {
    if (typeof data !== 'object' && typeof data !== 'string') {
      throw new ParseError(
        `Invalid data type for envelope. Expected string or object, got ${typeof data}`
      );
    }
    try {
      if (typeof data === 'string') {
        return schema.parse(JSON.parse(data));
      } else if (typeof data === 'object') {
        return schema.parse(data);
      }
    } catch (e) {
      throw new ParseError(`Failed to parse envelope`, { cause: e as Error });
    }
  };

  /**
   * Abstract function to safely parse the content of the envelope using provided schema.
   * safeParse is used to avoid throwing errors, thus we catuch all errors and wrap them in the result.
   * @param input
   * @param schema
   */
  public static readonly safeParse = <T extends ZodSchema>(
    input: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> => {
    try {
      if (typeof input !== 'object' && typeof input !== 'string') {
        return {
          success: false,
          error: new ParseError(
            `Invalid data type for envelope. Expected string or object, got ${typeof input}`
          ),
          originalEvent: input,
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
            error: new ParseError(`Failed to parse envelope`, {
              cause: parsed.error,
            }),
            originalEvent: input,
          };
    } catch (e) {
      return {
        success: false,
        error: new ParseError(`Failed to parse envelope`, {
          cause: e as Error,
        }),
        originalEvent: input,
      };
    }
  };
}
