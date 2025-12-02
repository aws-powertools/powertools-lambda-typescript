import { readFile } from 'node:fs/promises';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';

const app = new Router();

app.get('/logo', async () => {
  const logoFile = await readFile(`${process.env.LAMBDA_TASK_ROOT}/logo.png`);
  return {
    body: logoFile.toString('base64'),
    isBase64Encoded: true,
    headers: {
      'Content-Type': 'image/png',
    },
    statusCode: 200,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
