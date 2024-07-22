import { z, type ZodSchema } from 'zod';
import { SqsSchema } from '../schemas/sqs.js';
import { Envelope } from './envelope.js';
import type { ParsedResult } from '../types/index.js';
import { ParseError } from '../errors.js';

/**
 *  SQS Envelope to extract array of Records
 *
 *  The record's body parameter is a string, though it can also be a JSON encoded string.
 *  Regardless of its type it'll be parsed into a BaseModel object.
 *
 *  Note: Records will be parsed the same way so if model is str,
 *  all items in the list will be parsed as str and npt as JSON (and vice versa)
 */
export class SqsEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T>[] {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return super.parse(record.body, schema);
    });
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = SqsSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Sqs Envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const parsedRecords: z.infer<T>[] = [];
    for (const record of parsedEnvelope.data.Records) {
      const parsedRecord = super.safeParse(record.body, schema);
      if (!parsedRecord.success) {
        return {
          success: false,
          error: new ParseError('Failed to parse Sqs Record', {
            cause: parsedRecord.error,
          }),
          originalEvent: data,
        };
      }
      parsedRecords.push(parsedRecord.data);
    }

    return { success: true, data: parsedRecords };
  }
}
