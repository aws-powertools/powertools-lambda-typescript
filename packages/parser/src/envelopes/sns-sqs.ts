import { ZodError, type ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { SnsSqsNotificationSchema } from '../schemas/sns.js';
import { SqsSchema } from '../schemas/sqs.js';
import type { ParsedResult } from '../types/index.js';
import {
  envelopeDiscriminator,
  mergeRecordErrors,
  parseOrThrow,
  prefixIssuePaths,
  type SafeParseWithCauseResult,
  safeParseWithCause,
} from './envelope.js';

/**
 * SNS plus SQS Envelope to extract array of Records
 *
 * Published messages from SNS to SQS has a slightly different payload structure
 * than regular SNS messages, and when sent to SQS, they are stringified into the
 * `body` field of each SQS record.
 *
 * To parse the `Message` field of the SNS notification, we need to:
 * 1. Parse SQS schema with incoming data
 * 2. `JSON.parse()` the SNS payload and parse against SNS Notification schema
 * 3. Finally, parse the payload against the provided schema
 */
export const SnsSqsEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T>(data: unknown, schema: ZodType<T>): T[] {
    const parsedEnvelope = parseOrThrow(
      SqsSchema,
      data,
      'Failed to parse SQS Envelope'
    );

    return parsedEnvelope.Records.map((record, recordIndex) => {
      let body: unknown;
      try {
        body = JSON.parse(record.body);
      } catch (error) {
        throw new ParseError(
          `Failed to parse SQS Record at index ${recordIndex}`,
          {
            cause: new ZodError([
              {
                code: 'custom',
                input: record.body,
                message: `Invalid JSON - ${(error as Error).message}`,
                path: ['Records', recordIndex, 'body'],
              },
            ]),
          }
        );
      }

      try {
        return schema.parse(SnsSqsNotificationSchema.parse(body).Message);
      } catch (error) {
        throw new ParseError(
          `Failed to parse SQS Record at index ${recordIndex}`,
          { cause: prefixIssuePaths(error, ['Records', recordIndex, 'body']) }
        );
      }
    });
  },

  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T[]> {
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

    const parseRecord = (
      record: { body: string },
      index: number
    ): SafeParseWithCauseResult<T> => {
      const path = ['Records', index, 'body'];
      let body: unknown;
      try {
        body = JSON.parse(record.body);
      } catch (error) {
        return {
          success: false,
          error: new ZodError([
            {
              code: 'custom',
              message: `Invalid JSON - ${(error as Error).message}`,
              input: record.body,
              path,
            },
          ]),
        };
      }

      const notification = safeParseWithCause(
        SnsSqsNotificationSchema,
        body,
        path
      );
      if (!notification.success) return notification;

      return safeParseWithCause(schema, notification.data.Message, path);
    };

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      records: T[];
      errors: { [key: number]: unknown };
    }>(
      (acc, record, index) => {
        const parsed = parseRecord(record, index);
        if (parsed.success) {
          acc.records.push(parsed.data);
        } else {
          acc.success = false;
          acc.errors[index] = parsed.error;
        }
        return acc;
      },
      { success: true, records: [], errors: {} }
    );

    if (result.success) {
      return { success: true, data: result.records };
    }

    const indexes = Object.keys(result.errors);
    const errorMessage =
      indexes.length > 1
        ? `Failed to parse SQS Records at indexes ${indexes.join(', ')}`
        : `Failed to parse SQS Record at index ${indexes[0]}`;

    return {
      success: false,
      error: new ParseError(errorMessage, {
        cause: mergeRecordErrors(Object.values(result.errors)),
      }),
      originalEvent: data,
    };
  },
};
