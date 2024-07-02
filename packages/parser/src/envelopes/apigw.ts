import { Envelope } from './envelope.js';
import { z, type ZodSchema } from 'zod';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';
import type { ParsedResult } from '../types/parser.js';
import { ParseError } from '../errors.js';

/**
 * API Gateway envelope to extract data within body key
 */
export class ApiGatewayEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    return super.parse(APIGatewayProxyEventSchema.parse(data).body, schema);
  }

  public static safeParse<T extends ZodSchema>(
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

    const parsedBody = super.safeParse(parsedEnvelope.data.body, schema);

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
  }
}
