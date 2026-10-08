import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Keep the prerelease pinned so that compatibility results are reproducible.
export const middyVersions = [
  '@middy/core',
  'middy5',
  'middy6',
  'middy7',
  'middy8',
];
export const middySuites = {
  logger: ['injectLambdaContext', 'logEvent', 'logBuffer', 'workingWithkeys'],
  metrics: ['logMetrics'],
  tracer: ['middy', 'middy.concurrency'],
  idempotency: ['makeIdempotent'],
  parser: ['parser.middy'],
  validation: ['middleware'],
};

export default defineConfig({
  test: {
    projects: middyVersions.flatMap((version) =>
      Object.entries(middySuites).map(([workspace, suites]) => ({
        resolve: {
          alias: [
            {
              find: /^(@middy\/core|middy5)$/,
              replacement: fileURLToPath(import.meta.resolve(version)),
            },
          ],
        },
        test: {
          name: `${workspace}/${version}`,
          root: `packages/${workspace}`,
          environment: 'node',
          env: { MIDDY_TEST_VERSION: version },
          include: suites.map((suite) => `tests/unit/${suite}.test.ts`),
          setupFiles: ['../testing/src/setupEnv.ts'],
          hookTimeout: 1_000 * 60 * 10,
          testTimeout: 1_000 * 60 * 3,
        },
      }))
    ),
  },
});
