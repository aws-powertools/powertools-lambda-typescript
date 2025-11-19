import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';

const middlewareRouter = new Router();

// Simple logging middleware
const loggingMiddleware: Middleware = async ({ next }) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  return {
    message: 'Middleware applied',
    responseTime: duration,
  };
};

middlewareRouter.get('/', [loggingMiddleware], () => ({
  message: 'This will be replaced by middleware',
}));

export { middlewareRouter };
