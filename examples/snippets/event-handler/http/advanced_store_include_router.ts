import { Router } from '@aws-lambda-powertools/event-handler/http';

// Each sub-router declares only the store keys it needs

type AuthEnv = {
  store: {
    request: { userId: string };
    shared: { db: { query: (sql: string) => Promise<unknown> } };
  };
};

type FeatureEnv = {
  store: {
    request: { maxResults: number };
    shared: { cache: Map<string, unknown> };
  };
};

const authRouter = new Router<AuthEnv>();
authRouter.use(async ({ reqCtx, next }) => {
  reqCtx.set('userId', 'user-123');
  await next();
});

const featureRouter = new Router<FeatureEnv>();
featureRouter.use(async ({ reqCtx, next }) => {
  reqCtx.set('maxResults', 50);
  await next();
});

// Chain includeRouter to merge store types // (1)!
const app = new Router().includeRouter(authRouter).includeRouter(featureRouter);

app.get('/dashboard', (reqCtx) => {
  const userId = reqCtx.get('userId'); // (2)!
  const maxResults = reqCtx.get('maxResults'); // (3)!

  // @ts-expect-error - maxResults is number | undefined, not string
  const _wrong: string = reqCtx.get('maxResults'); // (4)!

  if (!userId || !maxResults) return { ready: false };
  return { userId, maxResults };
});
