import {
  HttpStatusCodes,
  Router,
} from '@aws-lambda-powertools/event-handler/http';
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

app.methodNotAllowed(async (error) => {
  logger.error('Method not allowed', { error });

  return {
    body: 'This method is not allowed',
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
