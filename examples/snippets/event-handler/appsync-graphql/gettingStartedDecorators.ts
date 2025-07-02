import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import {
  AppSyncGraphQLResolver,
  makeId,
} from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

class Lambda implements LambdaInterface {
  @app.onMutation('createTodo')
  public async createTodo({ title }: { title: string }) {
    logger.debug('Creating todo', { title });
    const todoId = makeId();
    // Simulate creating a todo in a database or external service
    return {
      id: todoId,
      title,
      completed: false,
    };
  }

  @app.onQuery('getTodo')
  public async getTodo({ id }: { id: string }) {
    logger.debug('Resolving todo', { id });
    // Simulate fetching a todo from a database or external service
    return {
      id,
      title: 'Todo Title',
      completed: false,
    };
  }

  @app.resolver({
    fieldName: 'listTodos',
    typeName: 'Query',
  })
  public async listTodos() {
    logger.debug('Resolving todos');
    // Simulate fetching a todo from a database or external service
    return [
      {
        id: 'todo-id',
        title: 'Todo Title',
        completed: false,
      },
      {
        id: 'todo-id-2',
        title: 'Todo Title 2',
        completed: true,
      },
    ];
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope: this }); // (1)!
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
