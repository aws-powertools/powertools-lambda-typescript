import { Router } from '@aws-lambda-powertools/event-handler/appsync-graphql';

const userRouter = new Router();

userRouter.onQuery('getUsers', async (args, { sharedContext }) => {
  const requestId = sharedContext?.get('requestId');
  return [{ id: 1, name: 'John Doe', email: 'john@example.com', requestId }];
});

export { userRouter };
