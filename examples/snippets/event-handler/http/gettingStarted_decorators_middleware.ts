import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import {
  Router,
  type MiddlewareFunction,
} from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

// Custom middleware to check authentication
const authMiddleware: MiddlewareFunction = async (reqCtx, next) => {
  const authHeader = reqCtx.req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: 'Unauthorized',
    };
  }

  return await next();
};

// Custom middleware to add request timing
const timingMiddleware: MiddlewareFunction = async (_reqCtx, next) => {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;

  logger.info('Request completed', { duration });

  return response;
};

class Lambda implements LambdaInterface {
  @app.get('/public/todos')
  public async getPublicTodos() {
    return {
      todos: [
        { id: '1', title: 'Public Todo 1', completed: false },
        { id: '2', title: 'Public Todo 2', completed: true },
      ],
    };
  }

  @app.get('/todos', [authMiddleware, timingMiddleware])
  public async getTodos() {
    return {
      todos: [
        { id: '1', title: 'Private Todo 1', completed: false },
        { id: '2', title: 'Private Todo 2', completed: true },
      ],
    };
  }

  @app.post('/todos', [authMiddleware])
  public async createTodo({ body }: { body: { title: string } }) {
    return {
      id: 'new-todo-id',
      title: body.title,
      completed: false,
    };
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope: this });
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
