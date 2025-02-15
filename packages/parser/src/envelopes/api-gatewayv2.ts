import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { APIGatewayProxyEventV2Schema } from '../schemas/apigwv2.js';
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
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
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

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> {
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
