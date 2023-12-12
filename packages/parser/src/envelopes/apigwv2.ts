import { parse } from './envelope.js';
import { z, ZodSchema } from 'zod';
import { APIGatewayProxyEventV2Schema } from '../schemas/apigwv2.js';

/**
 * API Gateway V2 envelope to extract data within body key
 */
export const apiGatewayV2Envelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  const parsedEnvelope = APIGatewayProxyEventV2Schema.parse(data);
  if (!parsedEnvelope.body) {
    throw new Error('Body field of API Gateway event is undefined');
  }

  return parse(parsedEnvelope.body, schema);
};
