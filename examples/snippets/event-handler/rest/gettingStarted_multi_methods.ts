declare function putTodo<T>(todo: unknown): Promise<{ id: string } & T>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { Logger } from '@aws-lambda-powertools/logger';
import {
  correlationPaths,
  search,
} from '@aws-lambda-powertools/logger/correlationId';
import type { Context } from 'aws-lambda/handler';

const logger = new Logger({
  correlationIdSearchFn: search,
});
const app = new Router({ logger });

app.route(
  async (_, { request }) => {
    const body = await request.json();
    const todo = await putTodo(body);

    return todo;
  },
  {
    path: '/todos',
    method: ['POST', 'PUT'],
  }
);

export const handler = async (event: unknown, context: Context) => {
  // You can continue using other utilities just as before
  logger.addContext(context);
  logger.setCorrelationId(event, correlationPaths.API_GATEWAY_REST);
  return app.resolve(event, context);
};
