import { validator } from '@aws-lambda-powertools/validation/decorator';
import type { Context } from 'aws-lambda';
import {
  type InboundSchema,
  type OutboundSchema,
  inboundSchema,
  outboundSchema,
} from './schemas.js';

class Lambda {
  @validator({
    inboundSchema,
    outboundSchema,
  })
  async handler(
    event: InboundSchema,
    _context: Context
  ): Promise<OutboundSchema> {
    return {
      statusCode: 200,
      body: `Hello from ${event.userId}`,
    };
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
