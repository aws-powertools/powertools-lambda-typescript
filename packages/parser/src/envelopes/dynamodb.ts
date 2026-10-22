import type { ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { DynamoDBStreamSchema } from '../schemas/index.js';
import type { DynamoDBStreamEnvelopeResponse } from '../types/envelope.js';
import type { ParsedResult } from '../types/index.js';
import {
  envelopeDiscriminator,
  mergeRecordErrors,
  parseOrThrow,
  safeParseWithCause,
} from './envelope.js';

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
  parse<T>(
    data: unknown,
    schema: ZodType<T>
  ): DynamoDBStreamEnvelopeResponse<T>[] {
    const parsedEnvelope = parseOrThrow(
      DynamoDBStreamSchema,
      data,
      'Failed to parse DynamoDB Stream envelope'
    );

    const processImage = (
      image: unknown,
      imageType: 'NewImage' | 'OldImage',
      recordIndex: number
    ) =>
      image
        ? parseOrThrow(
            schema,
            image,
            `Failed to parse DynamoDB record at index ${recordIndex}`,
            ['Records', recordIndex, 'dynamodb', imageType]
          )
        : undefined;

    return parsedEnvelope.Records.map((record, index) => ({
      NewImage: processImage(record.dynamodb.NewImage, 'NewImage', index),
      OldImage: processImage(record.dynamodb.OldImage, 'OldImage', index),
    }));
  },

  safeParse<T>(
    data: unknown,
    schema: ZodType<T>
  ): ParsedResult<unknown, DynamoDBStreamEnvelopeResponse<T>[]> {
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

    const processImage = (image: unknown, path: PropertyKey[]) =>
      image ? safeParseWithCause(schema, image, path) : undefined;

    const result = parsedEnvelope.data.Records.reduce<{
      success: boolean;
      records: DynamoDBStreamEnvelopeResponse<T>[];
      errors: { [key: number]: unknown[] };
    }>(
      (acc, record, index) => {
        const newImage = processImage(record.dynamodb.NewImage, [
          'Records',
          index,
          'dynamodb',
          'NewImage',
        ]);
        const oldImage = processImage(record.dynamodb.OldImage, [
          'Records',
          index,
          'dynamodb',
          'OldImage',
        ]);

        if (newImage?.success === false || oldImage?.success === false) {
          const errors: unknown[] = [];
          for (const image of [newImage, oldImage]) {
            if (image?.success === false) {
              errors.push(image.error);
            }
          }
          acc.success = false;
          acc.errors[index] = errors;
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
    const errorCause = mergeRecordErrors(Object.values(result.errors).flat());

    return {
      success: false,
      error: new ParseError(errorMessage, { cause: errorCause }),
      originalEvent: data,
    };
  },
};
