import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  Router,
  UnauthorizedError,
} from '@aws-lambda-powertools/event-handler/experimental-rest';

const errorsRouter = new Router();

// Error handling - standard HTTP errors
errorsRouter.get('/400', () => {
  throw new BadRequestError('Invalid request');
});

errorsRouter.get('/401', () => {
  throw new UnauthorizedError('Not authenticated');
});

errorsRouter.get('/403', () => {
  throw new ForbiddenError('Access denied');
});

errorsRouter.get('/404', () => {
  throw new NotFoundError('Resource not found');
});

errorsRouter.get('/405', () => {
  throw new MethodNotAllowedError('Method not allowed');
});

errorsRouter.get('/500', () => {
  throw new InternalServerError('Server error');
});

// Generic error (should become 500)
errorsRouter.get('/generic', () => {
  throw new Error('Unexpected error');
});

// Custom error handler for specific route
errorsRouter.get('/custom', () => {
  throw new BadRequestError('This will be caught by custom handler');
});

// Global error handler
errorsRouter.errorHandler(BadRequestError, async (error) => ({
  statusCode: 400,
  error: 'Bad Request',
  message: error.message,
  custom: true,
}));

// Custom 404 handler
errorsRouter.notFound(async () => ({
  statusCode: 404,
  error: 'Not Found',
  message: 'Custom not found handler',
}));

export { errorsRouter };
