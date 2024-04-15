import { Envelope } from './envelope.js';
import { z, type ZodSchema } from 'zod';
import { LambdaFunctionUrlSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { ParseError } from '../errors.js';

/**
 * Lambda function URL envelope to extract data within body key
 */
export class LambdaFunctionUrlEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    const parsedEnvelope = LambdaFunctionUrlSchema.parse(data);

    if (!parsedEnvelope.body) {
      throw new Error('Body field of Lambda function URL event is undefined');
    }

    return super.parse(parsedEnvelope.body, schema);
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = LambdaFunctionUrlSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Lambda function URL envelope'),
        originalEvent: data,
      };
    }

    const parsedBody = super.safeParse(parsedEnvelope.data.body, schema);
    if (!parsedBody.success) {
      return {
        success: false,
        error: new ParseError(
          'Failed to parse Lambda function URL body',
          parsedBody.error
        ),
        originalEvent: data,
      };
    }

    return parsedBody;
  }
}
