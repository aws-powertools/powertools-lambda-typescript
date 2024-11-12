import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
      include: ['packages/*/src/**'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'packages/batch/src/types.ts',
        'packages/commons/src/types/**',
        'packages/event-handler/src/types/**',
        'packages/idempotency/src/types/**',
        'packages/jmespath/src/types.ts',
        'packages/logger/src/types/**',
        'packages/metrics/**',
        'packages/parameters/src/types/**',
        'packages/parser/src/types/**',
        'layers/**',
        'packages/testing/**',
        'packages/tracer/src/types/**',
      ],
    },
    setupFiles: ['./packages/testing/src/setupEnv.ts'],
  },
});
