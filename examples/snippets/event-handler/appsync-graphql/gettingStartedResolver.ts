import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

app.resolver(
  async () => {
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
  },
  {
    fieldName: 'listTodos',
    typeName: 'Query',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
