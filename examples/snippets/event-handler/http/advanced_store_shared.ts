import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

// Set shared values during cold start
app.shared.set('region', process.env.AWS_REGION ?? 'us-east-1'); // (1)!
app.shared.set('startedAt', Date.now());

app.get('/health', (reqCtx) => {
  const region = reqCtx.shared.get('region') as string; // (2)!
  const startedAt = reqCtx.shared.get('startedAt') as number;
  const uptime = Date.now() - startedAt;

  return { status: 'ok', region, uptime };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
