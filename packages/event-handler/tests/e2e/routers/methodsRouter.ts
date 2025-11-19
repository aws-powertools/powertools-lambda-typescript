import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';

const methodsRouter = new Router();

// Basic HTTP methods routing
methodsRouter.get('/', () => ({ method: 'GET' }));
methodsRouter.post('/', () => ({ method: 'POST' }));
methodsRouter.put('/', () => ({ method: 'PUT' }));
methodsRouter.patch('/', () => ({ method: 'PATCH' }));
methodsRouter.delete('/', () => ({ method: 'DELETE' }));
methodsRouter.head('/', () => ({ method: 'HEAD' }));
methodsRouter.options('/', () => ({ method: 'OPTIONS' }));

export { methodsRouter };
