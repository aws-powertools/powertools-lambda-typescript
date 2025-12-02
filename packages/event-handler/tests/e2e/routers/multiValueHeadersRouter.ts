import { Router } from '@aws-lambda-powertools/event-handler/http';

const multiValueHeadersRouter = new Router();

multiValueHeadersRouter.get('/set-cookies', () => {
  return new Response(
    JSON.stringify({
      message: 'Multiple cookies set',
    }),
    {
      status: 200,
      headers: [
        ['Set-Cookie', 'session=abc123; Path=/; HttpOnly'],
        ['Set-Cookie', 'preferences=darkMode; Path=/; Max-Age=31536000'],
        ['Set-Cookie', 'tracking=xyz789; Path=/; Secure; SameSite=Strict'],
        ['Content-Type', 'application/json'],
      ],
    }
  );
});

multiValueHeadersRouter.get('/echo-headers', ({ req }) => {
  const acceptHeader = req.headers.get('accept');
  const customHeaders = req.headers.get('x-custom-multi');

  return {
    receivedHeaders: {
      accept: acceptHeader,
      'x-custom-multi': customHeaders,
    },
  };
});

export { multiValueHeadersRouter };
