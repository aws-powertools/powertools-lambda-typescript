import { Router } from '@aws-lambda-powertools/event-handler/http';

const router = new Router();
router.get('/', () => 'Get all todos');
router.get('/:id', () => 'Get a single todo item');

export { router };
