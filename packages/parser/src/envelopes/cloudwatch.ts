import { z, type ZodSchema } from 'zod';
import { Envelope } from './envelope.js';
import { CloudWatchLogsSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { ParseError } from '../errors.js';

/**
 * CloudWatch Envelope to extract a List of log records.
 *
 *  The record's body parameter is a string (after being base64 decoded and gzipped),
 *  though it can also be a JSON encoded string.
 *  Regardless of its type it'll be parsed into a BaseModel object.
 *
 *  Note: The record will be parsed the same way so if model is str
 */
export class CloudWatchEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T>[] {
    const parsedEnvelope = CloudWatchLogsSchema.parse(data);

    return parsedEnvelope.awslogs.data.logEvents.map((record) => {
      return super.parse(record.message, schema);
    });
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = CloudWatchLogsSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse CloudWatch envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }
    const parsedLogEvents: z.infer<T>[] = [];

    for (const record of parsedEnvelope.data.awslogs.data.logEvents) {
      const parsedMessage = super.safeParse(record.message, schema);
      if (!parsedMessage.success) {
        return {
          success: false,
          error: new ParseError('Failed to parse CloudWatch log event', {
            cause: parsedMessage.error,
          }),
          originalEvent: data,
        };
      } else {
        parsedLogEvents.push(parsedMessage.data);
      }
    }

    return {
      success: true,
      data: parsedLogEvents,
    };
  }
}
