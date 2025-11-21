import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { router } from './split_route';

const app = new Router();

// Split Routers
app.includeRouter(router, { prefix: '/todos' });

export const handler = async (event: APIGatewayProxyEvent, context: Context) =>
  app.resolve(event, context);
