import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

app.onQuery<{ id: string }>('getTodo', async ({ id }) => {
  logger.debug('Resolving todo', { id });
  // Simulate fetching a todo from a database or external service
  return {
    id,
    title: 'Todo Title',
    completed: false,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
