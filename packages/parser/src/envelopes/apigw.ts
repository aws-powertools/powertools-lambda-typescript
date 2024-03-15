import { Envelope } from './envelope.js';
import { z, type ZodSchema } from 'zod';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';
import type { ParsedResult } from '../types/parser.js';

/**
 * API Gateway envelope to extract data within body key
 */
export class ApiGatewayEnvelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    const parsedEnvelope = APIGatewayProxyEventSchema.parse(data);
    if (!parsedEnvelope.body) {
      throw new Error('Body field of API Gateway event is undefined');
    }

    return super.parse(parsedEnvelope.body, schema);
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> {
    const parsedEnvelope = APIGatewayProxyEventSchema.safeParse(data);
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
