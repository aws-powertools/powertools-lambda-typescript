import type { ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { EventBridgeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * Envelope for EventBridge schema that extracts and parses data from the `detail` key.
 */
export const EventBridgeEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T>(data: unknown, schema: ZodType<T>): T {
    try {
      return EventBridgeSchema.extend({
        detail: schema,
      }).parse(data).detail;
    } catch (error) {
      throw new ParseError('Failed to parse EventBridge envelope', {
        cause: error,
      });
    }
  },

  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T> {
    const parsedResult = EventBridgeSchema.extend({
      detail: schema,
    }).safeParse(data);
    if (!parsedResult.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse EventBridge envelope', {
          cause: parsedResult.error,
        }),
        originalEvent: data,
      };
    }

    return {
      success: true,
      data: parsedResult.data.detail,
    };
  },
};
