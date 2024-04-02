import { Envelope } from './envelope.js';
import { z, type ZodSchema } from 'zod';
import { LambdaFunctionUrlSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';

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
        ...parsedEnvelope,
        originalEvent: data,
      };
    }

    const parsedBody = super.safeParse(parsedEnvelope.data.body, schema);
    if (!parsedBody.success) {
      return {
        ...parsedBody,
        originalEvent: data,
      };
    }

    return parsedBody;
  }
}
