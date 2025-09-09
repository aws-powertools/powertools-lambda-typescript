import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { postRouter } from './postRouter';
import { usersRouter } from './userRouter';

const app = new AppSyncGraphQLResolver();

app.includeRouter([postRouter, usersRouter]);

app.appendContext({ requestId: crypto.randomUUID() });

export const handler = async (event, context) => app.resolve(event, context);
