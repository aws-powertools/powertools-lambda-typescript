import { Router } from '@aws-lambda-powertools/event-handler/http';

const router = new Router();
router.get('/todos', () => 'Get all todos');
router.get('/todos/:id', () => 'Get a single todo item');

export { router };
