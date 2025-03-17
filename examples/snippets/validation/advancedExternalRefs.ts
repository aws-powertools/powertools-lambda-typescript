import { validator } from '@aws-lambda-powertools/validation/decorator';
import type { Context } from 'aws-lambda';
import {
  type InboundSchema,
  defsSchema,
  inboundSchema,
  outboundSchema,
} from './schemasWithExternalRefs.js';

class Lambda {
  @validator({
    inboundSchema,
    outboundSchema,
    externalRefs: [defsSchema],
  })
  async handler(event: InboundSchema, _context: Context) {
    return {
      message: `processed ${event.userId}`,
      success: true,
    };
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
