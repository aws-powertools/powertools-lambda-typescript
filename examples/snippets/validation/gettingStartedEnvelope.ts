import { validator } from '@aws-lambda-powertools/validation/decorator';
import type { Context } from 'aws-lambda';
import { type InboundSchema, inboundSchema } from './schemas.js';

class Lambda {
  @validator({
    inboundSchema,
    envelope: 'detail',
  })
  async handler(event: InboundSchema, context: Context) {
    return {
      message: `processed ${event.userId}`,
      success: true,
    };
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
