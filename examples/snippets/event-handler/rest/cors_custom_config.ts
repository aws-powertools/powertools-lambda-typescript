import { Router, cors } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Context } from 'aws-lambda/handler';

const app = new Router();

// Custom CORS configuration
app.use(cors({
  origin: 'https://myapp.com',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposeHeaders: ['X-Total-Count', 'X-Request-ID'],
  credentials: true,
  maxAge: 3600, // 1 hour
}));

app.get('/api/data', async () => {
  return { data: 'protected endpoint' };
});

app.post('/api/data', async (_: unknown, { request }: { request: Request }) => {
  const body = await request.json();
  return { created: true, data: body };
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};