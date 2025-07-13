import type { ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { LambdaFunctionUrlSchema } from '../schemas/index.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * Lambda function URL envelope to extract data within body key
 */
export const LambdaFunctionUrlEnvelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T>(data: unknown, schema: ZodType<T>): T {
    try {
      return LambdaFunctionUrlSchema.extend({
        body: schema,
      }).parse(data).body;
    } catch (error) {
      throw new ParseError('Failed to parse Lambda function URL body', {
        cause: error,
      });
    }
  },

  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T> {
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
