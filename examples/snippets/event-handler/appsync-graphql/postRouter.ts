import { Router } from '@aws-lambda-powertools/event-handler/appsync-graphql';

const postRouter = new Router();

postRouter.onQuery('getPosts', async () => {
  return [{ id: 1, title: 'First post', content: 'Hello world!' }];
});

postRouter.onMutation('createPost', async ({ title, content }) => {
  return {
    id: Date.now(),
    title,
    content,
    createdAt: new Date().toISOString(),
  };
});

export { postRouter };
