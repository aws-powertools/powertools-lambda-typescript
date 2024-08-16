import { defineProject } from 'vitest/config';

export default defineProject({
  resolve: {
    conditions: ['source'],
  },
  test: {
    environment: 'node',
  },
});
