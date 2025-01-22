import { ZodError, type ZodIssue, type ZodSchema, type z } from 'zod';
import { ParseError } from '../errors.js';
import { SnsSqsNotificationSchema } from '../schemas/sns.js';
import { SqsSchema } from '../schemas/sqs.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 *  SNS plus SQS Envelope to extract array of Records
 *
 *  Published messages from SNS to SQS has a slightly different payload.
 *  Since SNS payload is marshalled into `Record` key in SQS, we have to:
 *
 *  1. Parse SQS schema with incoming data
 *  2. `JSON.parse()` the SNS payload and parse against SNS Notification schema
 *  3. Finally, parse the payload against the provided schema
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
        let cause = error as Error;
        if (error instanceof ZodError) {
          cause = new ZodError(
            (error as ZodError).issues.map((issue) => ({
              ...issue,
              path: ['Records', recordIndex, 'body', ...issue.path],
            }))
          );
        }
        throw new ParseError(
          `Failed to parse SQS Record at index ${recordIndex}`,
          {
            cause,
          }
        );
      }
    });
  },

  /* v8 ignore start */
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
      errors: { index?: number; issues?: ZodIssue[] };
    }>(
      (acc, record, index) => {
        const parsedRecord = schema.safeParse(record.body);

        if (!parsedRecord.success) {
          const issues = parsedRecord.error.issues.map((issue) => ({
            ...issue,
            path: ['Records', index, 'body', ...issue.path],
          }));
          acc.success = false;
          // @ts-expect-error - index is assigned
          acc.errors[index] = { issues };
          return acc;
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
          // @ts-expect-error - issues are assigned because success is false
          Object.values(result.errors).flatMap((error) => error.issues)
        ),
      }),
      originalEvent: data,
    };
  },
  /* v8 ignore stop */
};
