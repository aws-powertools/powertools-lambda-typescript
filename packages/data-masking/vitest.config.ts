import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    environment: 'node',
    typecheck: {
      tsconfig: './tests/tsconfig.json',
      include: ['./tests/types/**/*.ts'],
    },
  },
});
