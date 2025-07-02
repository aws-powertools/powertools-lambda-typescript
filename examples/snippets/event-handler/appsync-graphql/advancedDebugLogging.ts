import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { Logger } from '@aws-lambda-powertools/logger';
import {
  correlationPaths,
  search,
} from '@aws-lambda-powertools/logger/correlationId';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
  logLevel: 'DEBUG',
  correlationIdSearchFn: search,
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

export const handler = async (event: unknown, context: Context) => {
  logger.setCorrelationId(event, correlationPaths.APPSYNC_RESOLVER);
  return app.resolve(event, context);
};
