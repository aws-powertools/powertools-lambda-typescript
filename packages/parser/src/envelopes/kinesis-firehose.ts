import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { KinesisFirehoseSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope } from './envelope.js';

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
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = KinesisFirehoseSchema.parse(data);

    return parsedEnvelope.records.map((record) => {
      return Envelope.parse(record.data, schema);
    });
  },

  safeParse<T extends ZodSchema>(data: unknown, schema: T): ParsedResult {
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
    const parsedRecords: z.infer<T>[] = [];

    for (const record of parsedEnvelope.data.records) {
      const parsedData = Envelope.safeParse(record.data, schema);
      if (!parsedData.success) {
        return {
          success: false,
          error: new ParseError('Failed to parse Kinesis Firehose record', {
            cause: parsedData.error,
          }),
          originalEvent: data,
        };
      }
      parsedRecords.push(parsedData.data);
    }

    return {
      success: true,
      data: parsedRecords,
    };
  },
};
