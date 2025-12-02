import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const app = new Router();

// File path proxy
app.get(/\/files\/.+/, () => 'Catch any GET method under /files');

// API versioning with any format
app.get(/\/api\/v\d+\/.*/, () => 'Catch any GET method under /api/vX');

// Mixed: dynamic parameter + regex catch-all
app.get(/\/users\/:userId\/files\/.+/, (reqCtx) => {
  return {
    userId: reqCtx.params.userId,
  };
});

// Catch all route
app.get(/.+/, () => 'Catch any GET method');

export const handler = async (event: APIGatewayProxyEvent, context: Context) =>
  app.resolve(event, context);
