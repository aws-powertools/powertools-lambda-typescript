declare const db: {
  query: (sql: string) => Promise<{ id: string; title: string }[]>;
  end: () => Promise<void>;
};

import { Router } from '@aws-lambda-powertools/event-handler/http';
import { serve } from '@aws-lambda-powertools/event-handler/http/web-function';

const app = new Router();

app.get('/todos', async () => ({
  todos: await db.query('SELECT id, title FROM todos'),
}));

await serve(app, {
  shutdown: {
    timeoutMs: 500,
    onShutdown: async () => {
      await db.end();
    },
  },
});
