import { z, type ZodSchema } from 'zod';
import { APIGatewayProxyEventV2Schema } from '../schemas/apigwv2.js';
import { Envelope } from './envelope.js';
import type { ParsedResult } from '../types/index.js';

/**
 * API Gateway V2 envelope to extract data within body key
 */
export class ApiGatewayV2Envelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    const parsedEnvelope = APIGatewayProxyEventV2Schema.parse(data);
    if (!parsedEnvelope.body) {
      throw new Error('Body field of API Gateway event is undefined');
    }

    return super.parse(parsedEnvelope.body, schema);
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = APIGatewayProxyEventV2Schema.safeParse(data);
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
