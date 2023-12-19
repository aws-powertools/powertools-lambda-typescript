import { parse } from './envelope.js';
import { z, ZodSchema } from 'zod';
import { LambdaFunctionUrlSchema } from '../schemas/lambda.js';

/**
 * Lambda function URL envelope to extract data within body key
 */
export const lambdaFunctionUrlEnvelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  const parsedEnvelope = LambdaFunctionUrlSchema.parse(data);
  if (!parsedEnvelope.body) {
    throw new Error('Body field of Lambda function URL event is undefined');
  }

  return parse(parsedEnvelope.body, schema);
};
