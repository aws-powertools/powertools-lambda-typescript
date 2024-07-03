import { Envelope } from './envelope.js';
import { z, type ZodSchema } from 'zod';
import { KinesisDataStreamSchema } from '../schemas/kinesis.js';
import type { ParsedResult } from '../types/index.js';
import { ParseError } from '../errors.js';

/**
 * Kinesis Data Stream Envelope to extract array of Records
 *
 * The record's data parameter is a base64 encoded string which is parsed into a bytes array,
 * though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and not as JSON (and vice versa)
 */
export class KinesisEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    const parsedEnvelope = KinesisDataStreamSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return super.parse(record.kinesis.data, schema);
    });
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = KinesisDataStreamSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Kinesis Data Stream envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const parsedRecords: z.infer<T>[] = [];

    for (const record of parsedEnvelope.data.Records) {
      const parsedRecord = super.safeParse(record.kinesis.data, schema);
      if (!parsedRecord.success) {
        return {
          success: false,
          error: new ParseError('Failed to parse Kinesis Data Stream record', {
            cause: parsedRecord.error,
          }),
          originalEvent: data,
        };
      }
      parsedRecords.push(parsedRecord.data);
    }

    return {
      success: true,
      data: parsedRecords,
    };
  }
}
