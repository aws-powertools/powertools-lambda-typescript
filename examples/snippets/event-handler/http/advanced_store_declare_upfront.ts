import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { MergeEnv } from '@aws-lambda-powertools/event-handler/types';

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

type AppEnv = MergeEnv<[AuthEnv, FeatureEnv]>; // (1)!

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

const app = new Router<AppEnv>(); // (2)!
app.includeRouter(authRouter); // (3)!
app.includeRouter(featureRouter);

app.get('/dashboard', (reqCtx) => {
  const userId = reqCtx.get('userId'); // string | undefined
  const maxResults = reqCtx.get('maxResults'); // number | undefined

  if (!userId || !maxResults) return { ready: false };
  return { userId, maxResults };
});
