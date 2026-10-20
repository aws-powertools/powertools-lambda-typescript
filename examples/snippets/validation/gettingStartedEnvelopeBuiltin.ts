import { SQS } from '@aws-lambda-powertools/jmespath/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';
import { validator } from '@aws-lambda-powertools/validation/middleware';
import middy from '@middy/core';
import { type InboundSchema, inboundSchema } from './schemas.js';

const logger = new Logger();

export const handler = middy()
  .use(
    validator({
      inboundSchema,
      envelope: SQS,
    })
  )
  .handler(async (event: Array<InboundSchema>) => {
    for (const record of event) {
      logger.info(`Processing message ${record.userId}`);
    }
  });
