import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { cors } from '@aws-lambda-powertools/event-handler/experimental-rest/middleware';

const corsRouter = new Router();

corsRouter.use(
  cors({
    origin: ['https://example.com', 'https://another.com'],
    allowMethods: ['GET', 'POST', 'PUT'],
    maxAge: 300,
    credentials: true,
  })
);

corsRouter.get('/data', () => ({
  message: 'CORS enabled response',
}));

corsRouter.post('/data', async ({ req }) => {
  const body = await req.json();
  return { received: body };
});

export { corsRouter };
