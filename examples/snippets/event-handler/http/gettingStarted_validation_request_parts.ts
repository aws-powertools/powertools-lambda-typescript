import { Router } from '@aws-lambda-powertools/event-handler/http';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const app = new Router();

const pathSchema = z.object({ todoId: z.string().uuid() });
const querySchema = z.object({
  page: z.coerce.number().int().positive(), // (1)!
  limit: z.coerce.number().int().positive().max(100),
});
const headerSchema = z.object({ 'x-api-key': z.string() });

app.get(
  '/todos/:todoId',
  (reqCtx) => {
    const { todoId } = reqCtx.valid.req.path; // (2)!
    const { page, limit } = reqCtx.valid.req.query; // (3)!
    const { 'x-api-key': apiKey } = reqCtx.valid.req.headers; // (4)!
    return { id: todoId, page, limit, apiKey };
  },
  {
    validation: {
      req: {
        path: pathSchema,
        query: querySchema,
        headers: headerSchema,
      },
    },
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
