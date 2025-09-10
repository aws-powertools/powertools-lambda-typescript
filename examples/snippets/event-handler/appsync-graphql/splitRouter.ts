import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import type { Context } from 'aws-lambda';
import { postRouter } from './postRouter';
import { userRouter } from './userRouter';

const app = new AppSyncGraphQLResolver();

app.includeRouter([postRouter, userRouter]);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
