import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { EventBridgeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope } from './envelope.js';

/**
 * Envelope for EventBridge schema that extracts and parses data from the `detail` key.
 */
export const EventBridgeEnvelope = {
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    return Envelope.parse(EventBridgeSchema.parse(data).detail, schema);
  },

  safeParse<T extends ZodSchema>(data: unknown, schema: T): ParsedResult {
    const parsedEnvelope = EventBridgeSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse EventBridge envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const parsedDetail = Envelope.safeParse(parsedEnvelope.data.detail, schema);

    if (!parsedDetail.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse EventBridge envelope detail', {
          cause: parsedDetail.error,
        }),
        originalEvent: data,
      };
    }

    return parsedDetail;
  },
};
