import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { LambdaFunctionUrlSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope, envelopeDiscriminator } from './envelope.js';

/**
 * Lambda function URL envelope to extract data within body key
 */
export const LambdaFunctionUrlEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    try {
      return LambdaFunctionUrlSchema.extend({
        body: schema,
      }).parse(data).body;
    } catch (error) {
      throw new ParseError('Failed to parse Lambda function URL body', {
        cause: error as Error,
      });
    }
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> {
    const results = LambdaFunctionUrlSchema.extend({
      body: schema,
    }).safeParse(data);

    if (!results.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse Lambda function URL body', {
          cause: results.error,
        }),
        originalEvent: data,
      };
    }

    return {
      success: true,
      data: results.data.body,
    };
  },
};
