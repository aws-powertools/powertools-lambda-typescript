import { Router, RequestValidationError } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { validation } from '@aws-lambda-powertools/event-handler/experimental-rest/middleware';
import { z } from 'zod';

const app = new Router();

// Custom error handler for validation errors
app.onError(RequestValidationError, (error) => {
  return {
    statusCode: 422,
    body: {
      error: 'Validation Failed',
      message: error.message,
      component: error.component,
      // In development, include detailed validation errors
      ...(process.env.POWERTOOLS_DEV === 'true' && {
        details: error.details,
      }),
    },
  };
});

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().positive('Age must be positive'),
});

app.post('/users', {
  middleware: [validation({ req: { body: userSchema } })],
}, async (reqCtx) => {
  const body = reqCtx.req.body;
  
  return {
    statusCode: 201,
    body: { id: '123', ...body },
  };
});

export const handler = app.resolve.bind(app);
