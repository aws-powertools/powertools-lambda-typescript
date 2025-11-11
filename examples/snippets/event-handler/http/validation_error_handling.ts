import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
import { z } from 'zod';

const app = new Router();

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().positive('Age must be positive'),
});

app.post('/users', async () => {
  return {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  };
}, {
  validation: { req: { body: userSchema } },
});

export const handler = app.resolve.bind(app);
