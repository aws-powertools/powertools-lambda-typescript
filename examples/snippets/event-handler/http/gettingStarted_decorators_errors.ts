import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import {
  BadRequestError,
  HttpStatusCodes,
  type MethodNotAllowedError,
  type NotFoundError,
  Router,
  UnauthorizedError,
} from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

class Lambda implements LambdaInterface {
  private todos = [
    { id: '1', title: 'Todo 1', completed: false },
    { id: '2', title: 'Todo 2', completed: true },
  ];

  @app.errorHandler(BadRequestError)
  public handleBadRequest(error: BadRequestError) {
    logger.error('Bad request error', { error });

    return {
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: 'Bad Request',
      message: error.message,
    };
  }

  @app.errorHandler(UnauthorizedError)
  public handleUnauthorized(error: UnauthorizedError) {
    logger.error('Unauthorized error', { error });

    return {
      statusCode: HttpStatusCodes.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'You must be authenticated to access this resource',
    };
  }

  @app.notFound()
  public handleNotFound(error: NotFoundError) {
    logger.warn('Route not found', { error });

    return {
      statusCode: HttpStatusCodes.NOT_FOUND,
      message: `The route ${error.message} does not exist`,
    };
  }

  @app.methodNotAllowed()
  public handleMethodNotAllowed(error: MethodNotAllowedError) {
    logger.warn('Method not allowed', { error });

    return {
      statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
      message: 'This HTTP method is not allowed for this route',
    };
  }

  @app.get('/todos/:todoId')
  public async getTodo({ params }: { params: { todoId: string } }) {
    const todo = this.todos.find((t) => t.id === params.todoId);

    if (!todo) {
      throw new BadRequestError(`Todo with id ${params.todoId} not found`);
    }

    return todo;
  }

  @app.post('/todos')
  public async createTodo({ body }: { body: { title?: string } }) {
    if (!body.title) {
      throw new BadRequestError('Title is required');
    }

    const newTodo = {
      id: String(this.todos.length + 1),
      title: body.title,
      completed: false,
    };

    this.todos.push(newTodo);

    return newTodo;
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope: this });
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
