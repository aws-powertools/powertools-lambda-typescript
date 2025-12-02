import { Router } from '@aws-lambda-powertools/event-handler/http';

const binaryRouter = new Router();

binaryRouter.post('/upload', async ({ req }) => {
  const contentType = req.headers.get('content-type');
  const body = await req.text();

  return {
    received: true,
    contentType,
    bodyLength: body.length,
    isBase64Encoded: /^[A-Za-z0-9+/]+=*$/.test(body.replaceAll(/\s/g, '')),
  };
});

binaryRouter.get('/download', () => {
  const binaryData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const base64Data = binaryData.toString('base64');

  return new Response(base64Data, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Transfer-Encoding': 'base64',
    },
  });
});

binaryRouter.post('/image', async ({ req }) => {
  const contentType = req.headers.get('content-type');
  const body = await req.text();

  return {
    received: true,
    contentType,
    bodyLength: body.length,
  };
});

export { binaryRouter };
