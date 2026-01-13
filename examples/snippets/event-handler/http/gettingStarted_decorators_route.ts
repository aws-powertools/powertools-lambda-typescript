import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const app = new Router({ logger });

class Lambda implements LambdaInterface {
  @app.route('/todos/:todoId', ['GET', 'HEAD'])
  public async getTodoMultiMethod({ params }: { params: { todoId: string } }) {
    logger.debug('Getting todo', { todoId: params.todoId });

    return {
      id: params.todoId,
      title: 'Todo Title',
      completed: false,
    };
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope: this });
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
