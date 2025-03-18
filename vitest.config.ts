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
        'layers/**',
        'packages/*/src/types/**',
        'packages/*/src/types.ts',
        'packages/testing/**',
      ],
    },
    setupFiles: ['./packages/testing/src/setupEnv.ts'],
    hookTimeout: 1_000 * 60 * 10, // 10 minutes
    testTimeout: 1_000 * 60 * 3, // 3 minutes
  },
});
