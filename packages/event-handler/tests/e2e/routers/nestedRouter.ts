import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { Router } from '@aws-lambda-powertools/event-handler/http';

const nestedRouter = new Router();

nestedRouter.get('/info', ({ req }) => ({
  nested: true,
  path: new URL(req.url).pathname,
}));

nestedRouter.post('/create', async ({ req }) => {
  const body = (await req.json()) as JSONValue;
  return { nested: true, created: body };
});

export { nestedRouter };
