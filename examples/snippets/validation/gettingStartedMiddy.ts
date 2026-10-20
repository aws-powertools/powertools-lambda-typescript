import { validator } from '@aws-lambda-powertools/validation/middleware';
import middy from '@middy/core';
import {
  type InboundSchema,
  inboundSchema,
  type OutboundSchema,
  outboundSchema,
} from './schemas.js';

export const handler = middy()
  .use(
    validator({
      inboundSchema,
      outboundSchema,
    })
  )
  .handler(
    async (event: InboundSchema): Promise<OutboundSchema> => ({
      statusCode: 200,
      body: `Hello from ${event.userId}`,
    })
  );
