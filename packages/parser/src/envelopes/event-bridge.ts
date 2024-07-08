import { Envelope } from './envelope.js';
import { z, type ZodSchema } from 'zod';
import { EventBridgeSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { ParseError } from '../errors.js';

/**
 * Envelope for EventBridge schema that extracts and parses data from the `detail` key.
 */
export class EventBridgeEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    return super.parse(EventBridgeSchema.parse(data).detail, schema);
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
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

    const parsedDetail = super.safeParse(parsedEnvelope.data.detail, schema);

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
  }
}
