import {
  HttpStatusCodes,
  Router,
} from '@aws-lambda-powertools/event-handler/experimental-rest';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda/handler';

const logger = new Logger();
const app = new Router({ logger });

app.notFound(async (error, reqCtx) => {
  logger.error('Unable to get todo', { error });

  return {
    statusCode: HttpStatusCodes.IM_A_TEAPOT,
    body: "I'm a teapot!",
    headers: {
      'x-correlation-id': reqCtx.req.headers.get('x-correlation-id'),
    },
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
