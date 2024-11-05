import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { KinesisDataStreamSchema } from '../schemas/kinesis.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope } from './envelope.js';

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
export const KinesisEnvelope = {
  symbol: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = KinesisDataStreamSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return Envelope.parse(record.kinesis.data, schema);
    });
  },

  safeParse<T extends ZodSchema>(data: unknown, schema: T): ParsedResult {
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
      const parsedRecord = Envelope.safeParse(record.kinesis.data, schema);
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
  },
};
