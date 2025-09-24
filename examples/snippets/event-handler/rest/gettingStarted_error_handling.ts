declare function getTodoById<T>(todoId: unknown): Promise<{ id: string } & T>;
declare class GetTodoError extends Error {}

import {
  HttpStatusCodes,
  Router,
} from '@aws-lambda-powertools/event-handler/experimental-rest';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda/handler';

const logger = new Logger();
const app = new Router({ logger });

app.errorHandler(GetTodoError, async (error, reqCtx) => {
  logger.error('Unable to get todo', { error });

  return {
    statusCode: HttpStatusCodes.BAD_REQUEST,
    message: `Bad request: ${error.message} - ${reqCtx.req.headers.get('x-correlation-id')}`,
  };
});

app.get('/todos/:todoId', async ({ params: { todoId } }) => {
  const todo = await getTodoById(todoId); // May throw GetTodoError
  return { todo };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
