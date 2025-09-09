import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { postRouter } from './postRouter';
import { userRouter } from './userRouter';

const app = new AppSyncGraphQLResolver();

app.includeRouter([postRouter, userRouter]);

export const handler = async (event, context) => app.resolve(event, context);
