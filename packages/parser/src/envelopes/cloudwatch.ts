import { ZodError, type ZodIssue, type ZodSchema, type z } from 'zod';
import { ParseError } from '../errors.js';
import { CloudWatchLogsSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * CloudWatch Envelope to extract messages from the `awslogs.data.logEvents` key.
 */
export const CloudWatchEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = CloudWatchLogsSchema.parse(data);

    return parsedEnvelope.awslogs.data.logEvents.map((record, index) => {
      try {
        return schema.parse(record.message);
      } catch (error) {
        throw new ParseError(
          `Failed to parse CloudWatch log event at index ${index}`,
          {
            cause: new ZodError(
              (error as ZodError).issues.map((issue) => ({
                ...issue,
                path: [
                  'awslogs',
                  'data',
                  'logEvents',
                  index,
                  'message',
                  ...issue.path,
                ],
              }))
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
    let parsedEnvelope: ParsedResult<unknown, z.infer<T>>;
    try {
      parsedEnvelope = CloudWatchLogsSchema.safeParse(data);
    } catch (error) {
      parsedEnvelope = {
        success: false,
        error: error as Error,
      };
    }

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse CloudWatch Log envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const result = parsedEnvelope.data.awslogs.data.logEvents.reduce(
      (
        acc: {
          success: boolean;
          messages: z.infer<T>;
          errors: { [key: number]: { issues: ZodIssue[] } };
        },
        record: { message: string },
        index: number
      ) => {
        const result = schema.safeParse(record.message);
        if (!result.success) {
          const issues = result.error.issues.map((issue) => ({
            ...issue,
            path: [
              'awslogs',
              'data',
              'logEvents',
              index,
              'message',
              ...issue.path,
            ],
          }));

          acc.success = false;
          acc.errors[index] = { issues };
          return acc;
        }

        acc.messages.push(result.data);
        return acc;
      },
      {
        success: true,
        messages: [],
        errors: {},
      }
    );

    if (result.success) {
      return { success: true, data: result.messages };
    }

    const errorMessage =
      Object.keys(result.errors).length > 1
        ? `Failed to parse CloudWatch Log messages at indexes ${Object.keys(result.errors).join(', ')}`
        : `Failed to parse CloudWatch Log message at index ${Object.keys(result.errors)[0]}`;
    const errorCause = new ZodError(
      // @ts-expect-error - issues are assigned because success is false
      Object.values(result.errors).flatMap((error) => error.issues)
    );

    return {
      success: false,
      error: new ParseError(errorMessage, { cause: errorCause }),
      originalEvent: data,
    };
  },
};
