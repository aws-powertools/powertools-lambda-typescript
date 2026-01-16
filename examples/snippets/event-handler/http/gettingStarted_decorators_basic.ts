import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

class Lambda implements LambdaInterface {
  @app.get('/todos/:todoId')
  public async getTodo({ params }: { params: { todoId: string } }) {
    logger.debug('Getting todo', { todoId: params.todoId });

    return {
      id: params.todoId,
      title: 'Todo Title',
      completed: false,
    };
  }

  @app.post('/todos')
  public async createTodo({ body }: { body: { title: string } }) {
    logger.debug('Creating todo', { title: body.title });

    return {
      id: 'new-todo-id',
      title: body.title,
      completed: false,
    };
  }

  @app.delete('/todos/:todoId')
  public async deleteTodo({ params }: { params: { todoId: string } }) {
    logger.debug('Deleting todo', { todoId: params.todoId });

    return {
      message: `Todo ${params.todoId} deleted`,
    };
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope: this });
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
