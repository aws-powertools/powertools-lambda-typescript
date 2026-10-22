import type { ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { SnsSchema } from '../schemas/sns.js';
import type { ParsedResult } from '../types/index.js';
import {
  envelopeDiscriminator,
  mergeRecordErrors,
  parseOrThrow,
  safeParseWithCause,
} from './envelope.js';

/**
 * SNS Envelope to extract array of Records
 *
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and npt as JSON (and vice versa)
 */
export const SnsEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T>(data: unknown, schema: ZodType<T>): T[] {
    const parsedEnvelope = parseOrThrow(
      SnsSchema,
      data,
      'Failed to parse SNS envelope'
    );

    return parsedEnvelope.Records.map((record, index) =>
      parseOrThrow(
        schema,
        record.Sns.Message,
        `Failed to parse SNS record at index ${index}`,
        ['Records', index, 'Sns', 'Message']
      )
    );
  },

  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T[]> {
    const parsedEnvelope = SnsSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse SNS envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      messages: T[];
      errors: { [key: number]: unknown };
    }>(
      (acc, message, index) => {
        const parsedMessage = safeParseWithCause(schema, message.Sns.Message, [
          'Records',
          index,
          'Sns',
          'Message',
        ]);
        if (!parsedMessage.success) {
          acc.success = false;
          acc.errors[index] = parsedMessage.error;
          return acc;
        }

        acc.messages.push(parsedMessage.data);
        return acc;
      },
      { success: true, messages: [], errors: {} }
    );

    if (result.success) {
      return { success: true, data: result.messages };
    }

    const errorMessage =
      Object.keys(result.errors).length > 1
        ? `Failed to parse SNS messages at indexes ${Object.keys(result.errors).join(', ')}`
        : `Failed to parse SNS message at index ${Object.keys(result.errors)[0]}`;
    const errorCause = mergeRecordErrors(Object.values(result.errors));

    return {
      success: false,
      error: new ParseError(errorMessage, { cause: errorCause }),
      originalEvent: data,
    };
  },
};
