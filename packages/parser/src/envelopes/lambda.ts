import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { LambdaFunctionUrlSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope } from './envelope.js';

/**
 * Lambda function URL envelope to extract data within body key
 */
export const LambdaFunctionUrlEnvelope = {
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = LambdaFunctionUrlSchema.parse(data);

    if (!parsedEnvelope.body) {
      throw new Error('Body field of Lambda function URL event is undefined');
    }

    return Envelope.parse(parsedEnvelope.body, schema);
  },

  safeParse<T extends ZodSchema>(data: unknown, schema: T): ParsedResult {
    const parsedEnvelope = LambdaFunctionUrlSchema.safeParse(data);

    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Lambda function URL envelope'),
        originalEvent: data,
      };
    }

    const parsedBody = Envelope.safeParse(parsedEnvelope.data.body, schema);
    if (!parsedBody.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Lambda function URL body', {
          cause: parsedBody.error,
        }),
        originalEvent: data,
      };
    }

    return parsedBody;
  },
};
