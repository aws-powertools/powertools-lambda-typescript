declare const compresssBody: (body: string) => Promise<string>;

import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import type { Context } from 'aws-lambda';

interface CompressOptions {
  threshold?: number;
  level?: number;
}

// Factory function that returns middleware
const compress = (options: CompressOptions = {}): Middleware => {
  return async (params, reqCtx, next) => {
    await next();

    // Check if response should be compressed
    const body = await reqCtx.res.text();
    const threshold = options.threshold || 1024;

    if (body.length > threshold) {
      const compressedBody = await compresssBody(body);
      const compressedRes = new Response(compressedBody, reqCtx.res);
      compressedRes.headers.set('Content-Encoding', 'gzip');
      reqCtx.res = compressedRes;
    }
  };
};

const app = new Router();

// Use custom middleware globally
app.use(compress({ threshold: 500 }));

app.get('/data', async () => {
  return {
    message: 'Large response data',
    data: new Array(100).fill('content'),
  };
});

app.get('/small', async () => {
  return { message: 'Small response' };
});

export const handler = async (event: unknown, context: Context) => {
  return await app.resolve(event, context);
};
