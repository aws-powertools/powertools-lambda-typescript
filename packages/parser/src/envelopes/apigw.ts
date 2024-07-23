import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';
import type { ParsedResult } from '../types/parser.js';
import { Envelope } from './envelope';

/**
 * API Gateway envelope to extract data within body key
 */
export const ApiGatewayEnvelope = {
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    return Envelope.parse(APIGatewayProxyEventSchema.parse(data).body, schema);
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> {
    const parsedEnvelope = APIGatewayProxyEventSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse ApiGatewayEnvelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const parsedBody = Envelope.safeParse(parsedEnvelope.data.body, schema);

    if (!parsedBody.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse ApiGatewayEnvelope body', {
          cause: parsedBody.error,
        }),
        originalEvent: data,
      };
    }

    return parsedBody;
  },
};
