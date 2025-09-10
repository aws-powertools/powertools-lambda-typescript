import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import type { Context } from 'aws-lambda/handler';
import { postRouter } from './postRouter';
import { userRouter } from './userRouter';

const app = new AppSyncGraphQLResolver();

app.includeRouter([postRouter, userRouter]);

app.appendContext({ requestId: crypto.randomUUID() });

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
