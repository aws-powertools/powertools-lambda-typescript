import { composeMiddleware } from '@aws-lambda-powertools/event-handler/http';
import { cors } from '@aws-lambda-powertools/event-handler/http/middleware';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

const logging: Middleware = async ({ reqCtx, next }) => {
  logger.info(`Request: ${reqCtx.req.method} ${reqCtx.req.url}`);
  await next();
  logger.info(`Response: ${reqCtx.res.status}`);
};

const rateLimit: Middleware = async ({ reqCtx, next }) => {
  // Rate limiting logic would go here
  reqCtx.res.headers.set('X-RateLimit-Limit', '100');
  await next();
};

// Reusable composed middleware
const apiMiddleware = composeMiddleware([logging, cors(), rateLimit]);

export { apiMiddleware };
