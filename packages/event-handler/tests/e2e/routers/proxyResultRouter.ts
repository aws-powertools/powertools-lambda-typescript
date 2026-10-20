import { Router } from '@aws-lambda-powertools/event-handler/http';

const proxyResultRouter = new Router();

proxyResultRouter.get('/object', () => ({
  statusCode: 200,
  body: { id: 1, name: 'Alice' },
}));

proxyResultRouter.get('/array', () => ({
  statusCode: 200,
  body: [1, 2, 3],
}));

proxyResultRouter.get('/string', () => ({
  statusCode: 200,
  body: 'hello',
}));

proxyResultRouter.post('/created', () => ({
  statusCode: 201,
  body: { created: true },
}));

proxyResultRouter.delete('/deleted', () => ({
  statusCode: 204,
}));

export { proxyResultRouter };
