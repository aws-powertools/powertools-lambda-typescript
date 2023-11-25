import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { APIGatewayProxyEventSchema } from '../schemas/apigw.js';

/**
 * API Gateway envelope to extract data within body key"
 */
export class ApiGatewayEnvelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = APIGatewayProxyEventSchema.parse(data);

    return this._parse(parsedEnvelope.body, schema);
  }
}
