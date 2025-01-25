import { ZodError, type ZodIssue, type ZodSchema, type z } from 'zod';
import { ParseError } from '../errors.js';
import {
  type KinesisFirehoseRecordSchema,
  KinesisFirehoseSchema,
} from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope, envelopeDiscriminator } from './envelope.js';

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
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    let parsedEnvelope: z.infer<typeof KinesisFirehoseSchema>;
    try {
      parsedEnvelope = KinesisFirehoseSchema.parse(data);
    } catch (error) {
      throw new ParseError('Failed to parse Kinesis Firehose envelope', {
        cause: error as Error,
      });
    }

    return parsedEnvelope.records.map((record, recordIndex) => {
      let parsedRecord: z.infer<typeof KinesisFirehoseRecordSchema>;
      try {
        parsedRecord = schema.parse(record.data);
      } catch (error) {
        throw new ParseError(
          `Failed to parse Kinesis Firehose record at index ${recordIndex}`,
          {
            cause: new ZodError(
              (error as ZodError).issues.map((issue) => ({
                ...issue,
                path: ['records', recordIndex, 'data', ...issue.path],
              }))
            ),
          }
        );
      }
      return parsedRecord;
    });
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]> {
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
      records: z.infer<T>[];
      errors: {
        [key: number | string]: { issues: ZodIssue[] };
      };
    }>(
      (acc, record, index) => {
        const parsedRecord = schema.safeParse(record.data);

        if (!parsedRecord.success) {
          const issues = parsedRecord.error.issues.map((issue) => ({
            ...issue,
            path: ['records', index, 'data', ...issue.path],
          }));
          acc.success = false;
          acc.errors[index] = { issues };
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
        cause: new ZodError(
          Object.values(result.errors).flatMap((error) => error.issues)
        ),
      }),
      originalEvent: data,
    };
  },
};
