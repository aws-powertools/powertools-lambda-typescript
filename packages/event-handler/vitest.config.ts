import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    environment: 'node',
    setupFiles: ['../testing/src/setupEnv.ts'],
  },
});
