import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';

const paramsRouter = new Router();

// Path parameters - single
paramsRouter.get('/users/:userId', ({ params: { userId } }) => ({
  userId,
}));

// Path parameters - multiple
paramsRouter.get(
  '/users/:userId/posts/:postId',
  ({ params: { userId, postId } }) => ({
    userId,
    postId,
  })
);

// Query string parameters
paramsRouter.get('/search', ({ req }) => {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const limit = url.searchParams.get('limit');
  const filters = url.searchParams.getAll('filter');

  return {
    query,
    limit,
    filters: filters.length > 0 ? filters : undefined,
  };
});

export { paramsRouter };
