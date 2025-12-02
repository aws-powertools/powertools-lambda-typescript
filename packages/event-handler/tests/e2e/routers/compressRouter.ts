import { Router } from '@aws-lambda-powertools/event-handler/http';
import { compress } from '@aws-lambda-powertools/event-handler/http/middleware';

const compressRouter = new Router();

compressRouter.use(compress({ threshold: 100 })); // 100 byte threshold for testing

compressRouter.get('/large', () => ({
  message: 'This is a large response that should be compressed',
  data: 'x'.repeat(200), // ~260 bytes, exceeds threshold
}));

compressRouter.get('/small', () => ({
  message: 'Small', // ~20 bytes, below threshold
}));

export { compressRouter };
