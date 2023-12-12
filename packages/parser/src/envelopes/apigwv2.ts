import { Envelope } from './Envelope.js';
import { z, ZodSchema } from 'zod';
import { APIGatewayProxyEventV2Schema } from '../schemas/apigwv2.js';

/**
 * API Gateway V2 envelope to extract data within body key
 */
export class ApiGatwayV2Envelope extends Envelope {
  public constructor() {
    super();
  }

  public parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    const parsedEnvelope = APIGatewayProxyEventV2Schema.parse(data);
    if (parsedEnvelope.body) {
      return this._parse(parsedEnvelope.body, schema);
    } else {
      throw new Error('Body field of API Gateway V2 event is undefined');
    }
  }
}
