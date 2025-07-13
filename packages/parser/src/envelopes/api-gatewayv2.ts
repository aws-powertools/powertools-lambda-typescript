import type { ZodType } from 'zod';
import { ParseError } from '../errors.js';
import { APIGatewayProxyEventV2Schema } from '../schemas/api-gatewayv2.js';
import type { ParsedResult } from '../types/index.js';
import { envelopeDiscriminator } from './envelope.js';

/**
 * API Gateway V2 envelope to extract data within body key
 */
export const ApiGatewayV2Envelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T>(data: unknown, schema: ZodType<T>): T {
    try {
      return APIGatewayProxyEventV2Schema.extend({
        body: schema,
      }).parse(data).body;
    } catch (error) {
      throw new ParseError('Failed to parse API Gateway HTTP body', {
        cause: error as Error,
      });
    }
  },

  safeParse<T>(data: unknown, schema: ZodType<T>): ParsedResult<unknown, T> {
    const result = APIGatewayProxyEventV2Schema.extend({
      body: schema,
    }).safeParse(data);

    if (!result.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse API Gateway HTTP body', {
          cause: result.error,
        }),
        originalEvent: data,
      };
    }

    return {
      success: true,
      data: result.data.body,
    };
  },
};
