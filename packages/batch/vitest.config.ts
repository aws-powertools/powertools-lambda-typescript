import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    environment: 'node',
    setupFiles: ['../testing/src/setupEnv.ts'],
    hookTimeout: 1_000 * 60 * 10, // 10 minutes
    testTimeout: 1_000 * 60 * 3, // 3 minutes
  },
});
