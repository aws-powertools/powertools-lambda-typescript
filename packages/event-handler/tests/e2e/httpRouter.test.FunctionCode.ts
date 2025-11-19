import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Context } from 'aws-lambda';
import { binaryRouter } from './routers/binaryRouter.js';
import { compressRouter } from './routers/compressRouter.js';
import { corsRouter } from './routers/corsRouter.js';
import { errorsRouter } from './routers/errorsRouter.js';
import { methodsRouter } from './routers/methodsRouter.js';
import { middlewareRouter } from './routers/middlewareRouter.js';
import { multiValueHeadersRouter } from './routers/multiValueHeadersRouter.js';
import { nestedRouter } from './routers/nestedRouter.js';
import { paramsRouter } from './routers/paramsRouter.js';

const app = new Router();

// Include all routers with prefixes
app.includeRouter(methodsRouter, { prefix: '/methods' });
app.includeRouter(paramsRouter, { prefix: '/params' });
app.includeRouter(errorsRouter, { prefix: '/errors' });
app.includeRouter(middlewareRouter, { prefix: '/middleware' });
app.includeRouter(nestedRouter, { prefix: '/nested' });
app.includeRouter(corsRouter, { prefix: '/cors' });
app.includeRouter(compressRouter, { prefix: '/compress' });
app.includeRouter(multiValueHeadersRouter, { prefix: '/multi-headers' });
app.includeRouter(binaryRouter, { prefix: '/binary' });

// Request body parsing and headers
app.post('/echo', async ({ req }) => {
  const body = await req.json();
  const contentType = req.headers.get('content-type');
  const customHeader = req.headers.get('x-custom-header');
  const multiHeader = req.headers.get('x-multi-header');

  return {
    body,
    headers: {
      'content-type': contentType,
      'x-custom-header': customHeader,
      'x-multi-header': multiHeader,
    },
  };
});

app.post('/form', async ({ req }) => {
  const contentType = req.headers.get('content-type');
  const bodyText = await req.text();

  return {
    contentType,
    bodyLength: bodyText.length,
    received: true,
  };
});

// Custom response with status code and headers
app.get(
  '/custom-response',
  () =>
    new Response(JSON.stringify({ message: 'Custom response' }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
        'Cache-Control': 'max-age=3600',
      },
    })
);

// Root path
app.get('/', () => ({
  message: 'Root path',
  version: '1.0.0',
}));

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
