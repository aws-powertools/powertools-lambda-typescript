import { ZodError, type ZodIssue, type ZodSchema, type z } from 'zod';
import { ParseError } from '../errors.js';
import { SnsSchema } from '../schemas/sns.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * SNS Envelope to extract array of Records
 *
 * The record's body parameter is a string, though it can also be a JSON encoded string.
 * Regardless of its type it'll be parsed into a BaseModel object.
 *
 * Note: Records will be parsed the same way so if model is str,
 * all items in the list will be parsed as str and npt as JSON (and vice versa)
 */
export const SnsEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T>[] {
    const parsedEnvelope = SnsSchema.parse(data);

    return parsedEnvelope.Records.map((record, index) => {
      try {
        return schema.parse(record.Sns.Message);
      } catch (error) {
        throw new ParseError(`Failed to parse SNS record at index ${index}`, {
          cause: new ZodError(
            (error as ZodError).issues.map((issue) => ({
              ...issue,
              path: ['Records', index, 'Sns', 'Message', ...issue.path],
            }))
          ),
        });
      }
    });
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>[]> {
    const parsedEnvelope = SnsSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse SNS envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      messages: z.infer<T>[];
      errors: { index?: number; issues?: ZodIssue[] };
    }>(
      (acc, message, index) => {
        const parsedMessage = schema.safeParse(message.Sns.Message);
        if (!parsedMessage.success) {
          acc.success = false;
          const issues = parsedMessage.error.issues.map((issue) => ({
            ...issue,
            path: ['Records', index, 'Sns', 'Message', ...issue.path],
          }));
          // @ts-expect-error - index is assigned
          acc.errors[index] = { issues };
          return acc;
        }

        acc.messages.push(parsedMessage.data);
        return acc;
      },
      { success: true, messages: [], errors: {} }
    );

    if (result.success) {
      return { success: true, data: result.messages };
    }

    const errorMessage =
      Object.keys(result.errors).length > 1
        ? `Failed to parse SNS messages at indexes ${Object.keys(result.errors).join(', ')}`
        : `Failed to parse SNS message at index ${Object.keys(result.errors)[0]}`;
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
