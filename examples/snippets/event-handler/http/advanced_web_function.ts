import { Router } from '@aws-lambda-powertools/event-handler/http';
import { serve } from '@aws-lambda-powertools/event-handler/http/web-function';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'todos' });
const app = new Router({ logger });

app.get('/todos/:id', async ({ params, req, context }) => {
  logger.appendKeys({ requestId: context.awsRequestId });
  logger.info('Fetching todo', { userAgent: req.headers.get('user-agent') });

  return { id: params.id, title: 'Buy milk' };
});

app.post('/todos', async ({ req }) => {
  const todo = (await req.json()) as { title: string };

  return { created: todo };
});

await serve(app, { timeoutSeconds: 30 });
