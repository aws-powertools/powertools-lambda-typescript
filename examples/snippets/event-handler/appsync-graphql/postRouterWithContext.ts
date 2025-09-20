import { Router } from '@aws-lambda-powertools/event-handler/appsync-graphql';

const postRouter = new Router();

postRouter.onQuery('getPosts', async (args, { sharedContext }) => {
  const requestId = sharedContext?.get('requestId');
  return [{ id: 1, title: 'First post', content: 'Hello world!', requestId }];
});

export { postRouter };
