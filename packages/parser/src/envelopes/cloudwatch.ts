import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { CloudWatchLogsSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope, envelopeDiscriminator } from './envelope.js';

/**
 * CloudWatch Envelope to extract a List of log records.
 *
 *  The record's body parameter is a string (after being base64 decoded and gzipped),
 *  though it can also be a JSON encoded string.
 *  Regardless of its type it'll be parsed into a BaseModel object.
 *
 *  Note: The record will be parsed the same way so if model is str
 */
export const CloudWatchEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = CloudWatchLogsSchema.parse(data);

    return parsedEnvelope.awslogs.data.logEvents.map((record) => {
      return Envelope.parse(record.message, schema);
    });
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]> {
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
      const parsedMessage = Envelope.safeParse(record.message, schema);
      if (!parsedMessage.success) {
        return {
          success: false,
          error: new ParseError('Failed to parse CloudWatch log event', {
            cause: parsedMessage.error,
          }),
          originalEvent: data,
        };
      }
      parsedLogEvents.push(parsedMessage.data);
    }

    return {
      success: true,
      data: parsedLogEvents,
    };
  },
};
