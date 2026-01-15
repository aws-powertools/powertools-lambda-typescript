import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import {
  HttpStatusCodes,
  Router,
} from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

declare function getTodoById<T>(todoId: unknown): Promise<{ id: string } & T>;
declare class GetTodoError extends Error {}

const logger = new Logger();
const app = new Router({ logger });

class Lambda implements LambdaInterface {
  @app.errorHandler(GetTodoError)
  public async handleGetTodoError(
    error: GetTodoError,
    reqCtx: {
      req: { headers: { get: (key: string) => string | null } };
    }
  ) {
    logger.error('Unable to get todo', { error });

    return {
      statusCode: HttpStatusCodes.BAD_REQUEST,
      message: `Bad request: ${error.message} - ${reqCtx.req.headers.get('x-correlation-id')}`,
    };
  }

  @app.get('/todos/:todoId')
  public async getTodo({ params }: { params: { todoId: string } }) {
    const todo = await getTodoById(params.todoId); // May throw GetTodoError
    return { todo };
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope: this });
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
