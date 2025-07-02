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

app.onMutation<{ title: string }>('createTodo', async ({ title }) => {
  logger.debug('Creating todo', { title });
  const todoId = makeId();
  // Simulate creating a todo in a database or external service
  return {
    id: todoId,
    title,
    completed: false,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
