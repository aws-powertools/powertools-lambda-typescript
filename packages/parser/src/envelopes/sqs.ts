import { ZodError, type ZodType, type z } from 'zod';
import { ParseError } from '../errors.js';
import { SqsSchema } from '../schemas/sqs.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * SQS Envelope to extract array of Records
 *
 * The record's `body` parameter is a string and needs to be parsed against the provided schema.
 *
 * If you know that the `body` is a JSON string, you can use `JSONStringified` to parse it,
 * for example:
 *
 * ```ts
 * import { JSONStringified } from '@aws-lambda-powertools/helpers';
 * import { SqsEnvelope } from '@aws-lambda-powertools/parser/envelopes/sqs';
 *
 * const schema = z.object({
 *   name: z.string(),
 * });
 *
 * const parsed = SqsEnvelope.parse(event, JSONStringified(schema));
 * ```
 */
const SqsEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T>(data: unknown, schema: ZodType<T>): T[] {
    let parsedEnvelope: z.infer<typeof SqsSchema>;
    try {
      parsedEnvelope = SqsSchema.parse(data);
    } catch (error) {
      throw new ParseError('Failed to parse SQS Envelope', {
        cause: error as Error,
      });
    }

    return parsedEnvelope.Records.map((record, recordIndex) => {
      let parsedRecord: T;
      try {
        parsedRecord = schema.parse(record.body);
      } catch (error) {
        throw new ParseError(
          `Failed to parse SQS Record at index ${recordIndex}`,
          {
            cause: new ZodError(
              (error as ZodError).issues.map((issue) => ({
                ...issue,
                path: ['Records', recordIndex, 'body', ...issue.path],
              }))
            ),
          }
        );
      }
      return parsedRecord;
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

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      records: T[];
      errors: { index?: number; issues?: z.core.$ZodIssue[] };
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
};

export { SqsEnvelope };
