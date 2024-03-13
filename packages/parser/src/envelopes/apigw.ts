import { parse, parseSafe } from './envelope.js';
import { ZodSchema } from 'zod';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';
import { ParsedResult } from 'src/types/parser.js';

/**
 * API Gateway envelope to extract data within body key
 */
export const apiGatewayEnvelope = <T extends ZodSchema>(
  data: unknown,
  schema: T,
  safeParse?: boolean
): ParsedResult<T> => {
  if (safeParse) {
    const parsedEnvelope = APIGatewayProxyEventSchema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: parsedEnvelope.error,
        originalEvent: data,
      };
    }

    return parseSafe(parsedEnvelope.data.body, schema);
  }
  const parsedEnvelope = APIGatewayProxyEventSchema.parse(data);
  if (!parsedEnvelope.body) {
    throw new Error('Body field of API Gateway event is undefined');
  }

  return parse(parsedEnvelope.body, schema);
};
