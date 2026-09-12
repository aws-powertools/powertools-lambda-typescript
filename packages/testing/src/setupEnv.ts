import { expect, vi } from 'vitest';
import { matchers } from './matchers/index.js';

// Mock console methods to prevent output during tests
vi.spyOn(console, 'error').mockReturnValue();
vi.spyOn(console, 'warn').mockReturnValue();
vi.spyOn(console, 'debug').mockReturnValue();
vi.spyOn(console, 'info').mockReturnValue();
vi.spyOn(console, 'log').mockReturnValue();

expect.extend(matchers);

// Custom equality tester for ZodError
// see https://github.com/vitest-dev/vitest/issues/7315 & https://github.com/colinhacks/zod/issues/3950

class ZodErrorLike extends Error {
  public issues: Array<unknown>;
  constructor() {
    super();
    this.issues = [];
  }
}

function isZodError(value: unknown): value is ZodErrorLike {
  return value instanceof Error && value.name === 'ZodError';
}

expect.addEqualityTesters([
  function (a, b) {
    const aOk = isZodError(a);
    const bOk = isZodError(b);
    if (aOk && bOk) {
      // or this.equals(a.message, b.message)
      return this.equals(a.issues, b.issues);
    }
    return aOk === bOk ? undefined : false;
  },
]);

// Set up environment variables for testing
process.env._X_AMZN_TRACE_ID = '1-abcdef12-3456abcdef123456abcdef12';
process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
process.env.AWS_EXECUTION_ENV = 'nodejs22.x';
process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '128';
if (
  process.env.AWS_REGION === undefined &&
  process.env.CDK_DEFAULT_REGION === undefined
) {
  process.env.AWS_REGION = 'eu-west-1';
}
process.env._HANDLER = 'index.handler';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.AWS_XRAY_LOGGING_LEVEL = 'silent';
process.env.AWS_LAMBDA_INITIALIZATION_TYPE = 'on-demand';
// Exposes `InvokeStore._testing.reset()` so concurrency tests can drop the
// module-level instance between tests, see `CODING_STANDARDS.md`.
process.env.AWS_LAMBDA_BENCHMARK_MODE = '1';
