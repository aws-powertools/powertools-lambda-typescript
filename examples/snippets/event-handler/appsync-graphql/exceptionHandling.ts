import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { Logger } from '@aws-lambda-powertools/logger';
import { AssertionError } from 'node:assert';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'MyService',
});
const app = new AppSyncGraphQLResolver({ logger });

app.exceptionHandler(AssertionError, async (error) => {
  return {
    error: {
      message: error.message,
      type: error.name,
    },
  };
});

app.onQuery('createSomething', async () => {
  throw new AssertionError({
    message: 'This is an assertion error',
  });
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
