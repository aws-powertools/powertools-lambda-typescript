import { createReadStream } from 'node:fs';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

app.get('/logo', async (reqCtx) => {
  reqCtx.res.headers.set('Content-Type', 'image/png');
  return createReadStream(`${process.env.LAMBDA_TASK_ROOT}/logo.png`);
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
