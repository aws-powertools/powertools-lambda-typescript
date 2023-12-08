import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { LambdaFunctionUrlSchema } from '../schemas/lambda.js';

/**
 * Lambda function URL envelope to extract data within body key
 */
export class LambdaFunctionUrlEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = LambdaFunctionUrlSchema.parse(data);

    if (parsedEnvelope.body === undefined) {
      throw new Error('Body field of Lambda function URL event is undefined');
    }

    return this._parse(parsedEnvelope.body, schema);
  }
}
