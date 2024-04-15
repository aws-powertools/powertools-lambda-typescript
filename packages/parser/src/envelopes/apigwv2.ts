import { z, type ZodSchema } from 'zod';
import { APIGatewayProxyEventV2Schema } from '../schemas/apigwv2.js';
import { Envelope } from './envelope.js';
import type { ParsedResult } from '../types/index.js';
import { ParseError } from '../errors.js';

/**
 * API Gateway V2 envelope to extract data within body key
 */
export class ApiGatewayV2Envelope extends Envelope {
  public static parse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): z.infer<T> {
    return super.parse(APIGatewayProxyEventV2Schema.parse(data).body, schema);
  }

  public static safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult {
    const parsedEnvelope = APIGatewayProxyEventV2Schema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError(
          'Failed to parse API Gateway V2 envelope',
          parsedEnvelope.error
        ),
        originalEvent: data,
      };
    }

    const parsedBody = super.safeParse(parsedEnvelope.data.body, schema);

    if (!parsedBody.success) {
      return {
        success: false,
        error: new ParseError(
          'Failed to parse API Gateway V2 envelope body',
          parsedBody.error
        ),
        originalEvent: data,
      };
    }

    return parsedBody;
  }
}
