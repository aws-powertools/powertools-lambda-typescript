import type { ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { KinesisFirehoseSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import {
  envelopeDiscriminator,
  mergeRecordErrors,
  parseOrThrow,
  safeParseWithCause,
} from './envelope.js';

/**
 * Kinesis Firehose Envelope to extract array of Records
 *
 *  The record's data parameter is a base64 encoded string which is parsed into a bytes array,
 *  though it can also be a JSON encoded string.
 *  Regardless of its type it'll be parsed into a BaseModel object.
 *
 *  Note: Records will be parsed the same way so if model is str,
 *  all items in the list will be parsed as str and not as JSON (and vice versa)
 *
 *  https://docs.aws.amazon.com/lambda/latest/dg/services-kinesisfirehose.html
 */
export const KinesisFirehoseEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T>(data: unknown, schema: ZodType<T>): T[] {
    const parsedEnvelope = parseOrThrow(
      KinesisFirehoseSchema,
      data,
      'Failed to parse Kinesis Firehose envelope'
    );

    return parsedEnvelope.records.map((record, recordIndex) =>
      parseOrThrow(
        schema,
        record.data,
        `Failed to parse Kinesis Firehose record at index ${recordIndex}`,
        ['records', recordIndex, 'data']
      )
    );
  },

  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T[]> {
    const parsedEnvelope = KinesisFirehoseSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Kinesis Firehose envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const result = parsedEnvelope.data.records.reduce<{
      success: boolean;
      records: T[];
      errors: { [key: number]: unknown };
    }>(
      (acc, record, index) => {
        const parsedRecord = safeParseWithCause(schema, record.data, [
          'records',
          index,
          'data',
        ]);

        if (!parsedRecord.success) {
          acc.success = false;
          acc.errors[index] = parsedRecord.error;
          return acc;
        }

        acc.records.push(parsedRecord.data);
        return acc;
      },
      { success: true, records: [], errors: {} }
    );

    if (result.success) {
      return { success: true, data: result.records };
    }

    const errorMessage =
      Object.keys(result.errors).length > 1
        ? `Failed to parse Kinesis Firehose records at indexes ${Object.keys(result.errors).join(', ')}`
        : `Failed to parse Kinesis Firehose record at index ${Object.keys(result.errors)[0]}`;
    return {
      success: false,
      error: new ParseError(errorMessage, {
        cause: mergeRecordErrors(Object.values(result.errors)),
      }),
      originalEvent: data,
    };
  },
};
