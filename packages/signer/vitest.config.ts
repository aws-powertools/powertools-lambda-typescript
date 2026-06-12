import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    environment: 'node',
    setupFiles: ['../testing/src/setupEnv.ts'],
    typecheck: {
      tsconfig: './tests/tsconfig.json',
      include: ['./tests/types/**/*.ts'],
    },
  },
});
