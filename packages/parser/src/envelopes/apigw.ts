import { parse } from './envelope.js';
import { z, ZodSchema } from 'zod';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';

/**
 * API Gateway envelope to extract data within body key
 */
export const apiGatewayEnvelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  const parsedEnvelope = APIGatewayProxyEventSchema.parse(data);
  if (!parsedEnvelope.body) {
    throw new Error('Body field of API Gateway event is undefined');
  }

  return parse(parsedEnvelope.body, schema);
};
