import type { ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { EventBridgeSchema } from '../schemas/eventbridge.js';
import { EventBridgeWithMetadataRecordSchema } from '../schemas/eventbridge-with-metadata.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * Validates a WITH_METADATA batch and extracts each record's parsed `Data.detail`.
 *
 * Returns details in input order. Invalid records fail the whole batch, with
 * validation paths relative to the original input. Use the record schema
 * directly for single-object delivery or to retain delivery metadata.
 */
const EventBridgeWithMetadataEnvelope = {
  /**
   * Identifies the envelope's array output.
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,

  /**
   * Parses every record's detail using the supplied schema.
   *
   * @param data - the batch to parse
   * @param schema - the schema for each record's detail
   */
  parse<T>(data: unknown, schema: ZodType<T>): T[] {
    try {
      return EventBridgeWithMetadataRecordSchema.extend({
        Data: EventBridgeSchema.extend({ detail: schema }),
      })
        .array()
        .nonempty()
        .parse(data)
        .map((record) => record.Data.detail);
    } catch (error) {
      throw new ParseError(
        'Failed to parse EventBridge WITH_METADATA envelope',
        {
          cause: error,
        }
      );
    }
  },

  /**
   * Parses a batch, returning the original input and error on failure.
   *
   * @param data - the batch to parse
   * @param schema - the schema for each record's detail
   */
  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T[]> {
    try {
      return {
        success: true,
        data: EventBridgeWithMetadataEnvelope.parse(data, schema),
      };
    } catch (error) {
      return {
        success: false,
        // parse always wraps validation and transform failures in ParseError.
        error: error as ParseError,
        originalEvent: data,
      };
    }
  },
};

export { EventBridgeWithMetadataEnvelope };
