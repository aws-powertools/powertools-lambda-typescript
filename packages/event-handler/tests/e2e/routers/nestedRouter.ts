import { Router } from '@aws-lambda-powertools/event-handler/http';

const nestedRouter = new Router();

nestedRouter.get('/info', ({ event }) => ({
  nested: true,
  path: event.path,
}));

nestedRouter.post('/create', async ({ req }) => {
  const body = await req.json();
  return { nested: true, created: body };
});

export { nestedRouter };
