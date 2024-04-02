import { z, type ZodSchema } from 'zod';
import { Envelope } from './envelope.js';
import { SnsSchema, SnsSqsNotificationSchema } from '../schemas/sns.js';
import { SqsSchema } from '../schemas/sqs.js';
import type { ParsedResult } from '../types/index.js';

/**
 * SNS Envelope to extract array of Records
 *
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and npt as JSON (and vice versa)
 */
export class SnsEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    const parsedEnvelope = SnsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      return super.parse(record.Sns.Message, schema);
    });
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = SnsSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        ...parsedEnvelope,
        originalEvent: data,
      };
    }

    const parsedMessages: z.infer<T>[] = [];
    for (const record of parsedEnvelope.data.Records) {
      const parsedMessage = super.safeParse(record.Sns.Message, schema);
      if (!parsedMessage.success) {
        return {
          ...parsedMessage,
          originalEvent: data,
        };
      }
      parsedMessages.push(parsedMessage.data);
    }

    return {
      success: true,
      data: parsedMessages,
    };
  }
}

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
export class SnsSqsEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    const parsedEnvelope = SqsSchema.parse(data);

    return parsedEnvelope.Records.map((record) => {
      const snsNotification = SnsSqsNotificationSchema.parse(
        JSON.parse(record.body)
      );

      return super.parse(snsNotification.Message, schema);
    });
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = SqsSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        ...parsedEnvelope,
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
            ...snsNotification,
            originalEvent: data,
          };
        }
        const parsedMessage = super.safeParse(
          snsNotification.data.Message,
          schema
        );
        if (!parsedMessage.success) {
          return {
            ...parsedMessage,
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
  }
}
