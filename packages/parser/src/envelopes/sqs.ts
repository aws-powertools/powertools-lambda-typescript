import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { SnsSqsNotificationSchema } from '../schemas/sns.js';
import { SqsSchema } from '../schemas/sqs.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope, envelopeDiscriminator } from './envelope.js';

/**
 *  SQS Envelope to extract array of Records
 *
 *  The record's body parameter is a string, though it can also be a JSON encoded string.
 *  Regardless of its type it'll be parsed into a BaseModel object.
 *
 *  Note: Records will be parsed the same way so if model is str,
 *  all items in the list will be parsed as str and npt as JSON (and vice versa)
 */
export const SqsEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return Envelope.parse(record.body, schema);
    });
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]> {
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
      const parsedRecord = Envelope.safeParse(record.body, schema);
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
  },
};

/**
 *  SNS plus SQS Envelope to extract array of Records
 *
 *  Published messages from SNS to SQS has a slightly different payload.
 *  Since SNS payload is marshalled into `Record` key in SQS, we have to:
 *
 *  1. Parse SQS schema with incoming data
 *  2. Unmarshall SNS payload and parse against SNS Notification schema not SNS/SNS Record
 *  3. Finally, parse provided model against payload extracted
 *
 */
export const SnsSqsEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      const snsNotification = SnsSqsNotificationSchema.parse(
        JSON.parse(record.body)
      );

      return Envelope.parse(snsNotification.Message, schema);
    });
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]> {
    const parsedEnvelope = SqsSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse SQS envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const parsedMessages: z.infer<T>[] = [];

    // JSON.parse can throw an error, thus we catch it and return ParsedErrorResult
    try {
      for (const record of parsedEnvelope.data.Records) {
        const snsNotification = SnsSqsNotificationSchema.safeParse(
          JSON.parse(record.body)
        );
        if (!snsNotification.success) {
          return {
            success: false,
            error: new ParseError('Failed to parse SNS notification', {
              cause: snsNotification.error,
            }),
            originalEvent: data,
          };
        }
        const parsedMessage = Envelope.safeParse(
          snsNotification.data.Message,
          schema
        );
        if (!parsedMessage.success) {
          return {
            success: false,
            error: new ParseError('Failed to parse SNS message', {
              cause: parsedMessage.error,
            }),
            originalEvent: data,
          };
        }
        parsedMessages.push(parsedMessage.data);
      }
    } catch (e) {
      return {
        success: false,
        error: e as Error,
        originalEvent: data,
      };
    }

    return { success: true, data: parsedMessages };
  },
};
