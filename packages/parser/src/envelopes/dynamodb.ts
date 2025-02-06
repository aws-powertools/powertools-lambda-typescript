import { ZodError, type ZodIssue, type ZodSchema, type z } from 'zod';
import { ParseError } from '../errors.js';
import { DynamoDBStreamSchema } from '../schemas/index.js';
import type { DynamoDBStreamEnvelopeResponse } from '../types/envelope.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * DynamoDB Stream Envelope to extract data within NewImage/OldImage
 *
 * Note: Values are the parsed models. Images' values can also be None, and
 * length of the list is the record's amount in the original event.
 */
export const DynamoDBStreamEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'array' as const,
  parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): DynamoDBStreamEnvelopeResponse<z.infer<T>>[] {
    const parsedEnvelope = DynamoDBStreamSchema.parse(data);

    const processImage = (
      image: unknown,
      imageType: 'NewImage' | 'OldImage',
      recordIndex: number
    ) => {
      try {
        return image ? schema.parse(image) : undefined;
      } catch (error) {
        throw new ParseError(
          `Failed to parse DynamoDB record at index ${recordIndex}`,
          {
            cause: new ZodError(
              (error as ZodError).issues.map((issue) => ({
                ...issue,
                path: [
                  'Records',
                  recordIndex,
                  'dynamodb',
                  imageType,
                  ...issue.path,
                ],
              }))
            ),
          }
        );
      }
    };

    return parsedEnvelope.Records.map((record, index) => ({
      NewImage: processImage(record.dynamodb.NewImage, 'NewImage', index),
      OldImage: processImage(record.dynamodb.OldImage, 'OldImage', index),
    }));
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, DynamoDBStreamEnvelopeResponse<z.infer<T>>[]> {
    const parsedEnvelope = DynamoDBStreamSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse DynamoDB Stream envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const processImage = (image: unknown) =>
      image ? schema.safeParse(image) : undefined;

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      records: DynamoDBStreamEnvelopeResponse<z.infer<T>>[];
      errors: { index?: number; issues?: ZodIssue[] };
    }>(
      (acc, record, index) => {
        const newImage = processImage(record.dynamodb.NewImage);
        const oldImage = processImage(record.dynamodb.OldImage);

        if (newImage?.success === false || oldImage?.success === false) {
          const issues: ZodIssue[] = [];
          for (const key of ['NewImage', 'OldImage']) {
            const image = key === 'NewImage' ? newImage : oldImage;
            if (image?.success === false) {
              issues.push(
                ...(image.error as ZodError).issues.map((issue) => ({
                  ...issue,
                  path: ['Records', index, 'dynamodb', key, ...issue.path],
                }))
              );
            }
          }
          acc.success = false;
          // @ts-expect-error - index is assigned
          acc.errors[index] = { issues };
          return acc;
        }

        acc.records.push({
          NewImage: newImage?.data,
          OldImage: oldImage?.data,
        });
        return acc;
      },
      { success: true, records: [], errors: {} }
    );

    if (result.success) {
      return { success: true, data: result.records };
    }

    const errorMessage =
      Object.keys(result.errors).length > 1
        ? `Failed to parse records at indexes ${Object.keys(result.errors).join(', ')}`
        : `Failed to parse record at index ${Object.keys(result.errors)[0]}`;
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
