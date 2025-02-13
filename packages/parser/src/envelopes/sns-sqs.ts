import { ZodError, type ZodIssue, type ZodSchema, type z } from 'zod';
import { ParseError } from '../errors.js';
import { SnsSqsNotificationSchema } from '../schemas/sns.js';
import { SqsSchema } from '../schemas/sqs.js';
import type { ParsedResult, SnsSqsNotification } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

const createError = (index: number, issues: ZodIssue[]) => ({
  issues: issues.map((issue) => ({
    ...issue,
    path: ['Records', index, 'body', ...issue.path],
  })),
});

type ParseStepSuccess<T> = {
  success: true;
  data: T;
};

type ParseStepError = {
  success: false;
  error: { issues: ZodIssue[] };
};

type ParseStepResult<T> = ParseStepSuccess<T> | ParseStepError;

const parseStep = <U>(
  parser: (data: unknown) => z.SafeParseReturnType<unknown, U>,
  data: unknown,
  index: number
): ParseStepResult<U> => {
  const result = parser(data);
  return result.success
    ? { success: true, data: result.data }
    : {
        success: false,
        error: createError(index, result.error.issues),
      };
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

    const parseRecord = (
      record: { body: string },
      index: number
    ): ParseStepResult<z.infer<T>> => {
      try {
        const body = JSON.parse(record.body);
        const notification = parseStep<SnsSqsNotification>(
          (data) => SnsSqsNotificationSchema.safeParse(data),
          body,
          index
        );
        if (!notification.success) return notification;

        return parseStep<z.infer<T>>(
          (data) => schema.safeParse(data),
          notification.data.Message,
          index
        );
      } catch {
        return {
          success: false,
          error: createError(index, [
            {
              code: 'custom',
              message: 'Invalid JSON',
              path: [],
            },
          ]),
        };
      }
    };

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      records: z.infer<T>[];
      errors: {
        [key: number | string]: { issues: ZodIssue[] };
      };
    }>(
      (acc, record, index) => {
        const parsed = parseRecord(record, index);
        if (!parsed.success) {
          acc.success = false;
          acc.errors[index] = parsed.error;
        } else {
          acc.records.push(parsed.data);
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
        cause: new ZodError(
          Object.values(result.errors).flatMap((e) => e.issues)
        ),
      }),
      originalEvent: data,
    };
  },
};
