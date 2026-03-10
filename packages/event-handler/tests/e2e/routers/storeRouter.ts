import { Router } from '@aws-lambda-powertools/event-handler/http';

type StoreEnv = {
  store: {
    request: { requestId: string };
    shared: { appName: string; version: number };
  };
};

const storeRouter = new Router<StoreEnv>();

// Set shared store values at module level (cold start)
storeRouter.shared.set('appName', 'powertools-e2e');
storeRouter.shared.set('version', 42);

// Middleware sets a request-scoped value
storeRouter.use(async ({ reqCtx, next }) => {
  reqCtx.set('requestId', crypto.randomUUID());
  await next();
});

// Route that reads from request store
storeRouter.get('/request', (reqCtx) => {
  const requestId: string = reqCtx.get('requestId') ?? '';
  return { requestId };
});

// Route that reads from shared store
storeRouter.get('/shared', (reqCtx) => {
  const appName: string = reqCtx.shared.get('appName') ?? '';
  const version: number = reqCtx.shared.get('version') ?? 0;
  return { appName, version };
});

// Route that reads from both stores
storeRouter.get('/both', (reqCtx) => {
  const requestId: string = reqCtx.get('requestId') ?? '';
  const appName: string = reqCtx.shared.get('appName') ?? '';
  const version: number = reqCtx.shared.get('version') ?? 0;
  return { requestId, appName, version };
});

export { storeRouter, type StoreEnv };
