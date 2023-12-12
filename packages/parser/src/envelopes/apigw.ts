import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';
import { type ApiGatewayProxyEvent } from '../types/schema.js';

/**
 * API Gateway envelope to extract data within body key"
 */
export class ApiGatewayEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope: ApiGatewayProxyEvent =
      APIGatewayProxyEventSchema.parse(data);
    if (parsedEnvelope.body) {
      return this._parse(parsedEnvelope.body, schema);
    } else {
      throw new Error('Body field of API Gateway event is undefined');
    }
  }
}
