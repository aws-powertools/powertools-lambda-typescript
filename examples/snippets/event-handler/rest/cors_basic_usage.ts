import { Router, cors } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Context } from 'aws-lambda/handler';

const app = new Router();

// Basic CORS with default configuration
// - origin: '*'
// - allowMethods: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT']
// - allowHeaders: ['Authorization', 'Content-Type', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']
// - exposeHeaders: []
// - credentials: false
app.use(cors());

app.get('/api/users', async () => {
  return { users: ['user1', 'user2'] };
});

app.post('/api/users', async (_: unknown, { request }: { request: Request }) => {
  const body = await request.json();
  return { created: true, user: body };
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};