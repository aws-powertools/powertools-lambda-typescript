import { ZodError, type ZodIssue, type ZodSchema, type z } from 'zod';
import { ParseError } from '../errors.js';
import { SnsSqsNotificationSchema } from '../schemas/sns.js';
import { SqsSchema } from '../schemas/sqs.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

const setError = <T>(
  acc: {
    success: boolean;
    records: T;
    errors: {
      [key: number | string]: { issues: ZodIssue[] };
    };
  },
  index: number,
  issues: ZodIssue[]
) => {
  acc.success = false;
  acc.errors[index] = {
    issues,
  };

  return acc;
};

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
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    let parsedEnvelope: z.infer<typeof SqsSchema>;
    try {
      parsedEnvelope = SqsSchema.parse(data);
    } catch (error) {
      throw new ParseError('Failed to parse SQS Envelope', {
        cause: error as Error,
      });
    }

    return parsedEnvelope.Records.map((record, recordIndex) => {
      try {
        return schema.parse(
          SnsSqsNotificationSchema.parse(JSON.parse(record.body)).Message
        );
      } catch (error) {
        throw new ParseError(
          `Failed to parse SQS Record at index ${recordIndex}`,
          {
            cause: new ZodError(
              error instanceof ZodError
                ? (error as ZodError).issues.map((issue) => ({
                    ...issue,
                    path: ['Records', recordIndex, 'body', ...issue.path],
                  }))
                : [
                    {
                      code: 'custom',
                      message: 'Invalid JSON',
                      path: ['Records', recordIndex, 'body'],
                    },
                  ]
            ),
          }
        );
      }
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

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      records: z.infer<T>[];
      errors: {
        [key: number | string]: { issues: ZodIssue[] };
      };
    }>(
      (acc, record, index) => {
        const baseErrorPath = ['Records', index, 'body'];

        // First parse the body of the record as JSON
        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(record.body);
        } catch (error) {
          return setError(acc, index, [
            {
              code: 'custom',
              message: 'Invalid JSON',
              path: baseErrorPath,
            },
          ]);
        }

        // Then parse it using the SNS notification schema
        const parsedNotification =
          SnsSqsNotificationSchema.safeParse(parsedBody);
        if (!parsedNotification.success) {
          return setError(
            acc,
            index,
            parsedNotification.error.issues.map((issue) => ({
              ...issue,
              path: [...baseErrorPath, ...issue.path],
            }))
          );
        }

        // Finally, parse the message against the provided schema
        const parsedRecord = schema.safeParse(parsedNotification.data.Message);
        if (!parsedRecord.success) {
          return setError(
            acc,
            index,
            parsedRecord.error.issues.map((issue) => ({
              ...issue,
              path: [...baseErrorPath, ...issue.path],
            }))
          );
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
        ? `Failed to parse SQS Records at indexes ${Object.keys(result.errors).join(', ')}`
        : `Failed to parse SQS Record at index ${Object.keys(result.errors)[0]}`;
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
