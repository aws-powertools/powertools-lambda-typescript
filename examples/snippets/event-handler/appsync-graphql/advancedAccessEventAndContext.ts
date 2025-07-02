import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

app.onQuery<{ id: string }>('getTodo', async ({ id }, { event, context }) => {
  const { headers } = event.request; // (1)!
  const { awsRequestId } = context;
  logger.info('headers', { headers, awsRequestId });

  return {
    id,
    title: 'Todo Title',
    completed: false,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
