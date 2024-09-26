import { toReceiveCommandWith } from 'aws-sdk-client-mock-vitest';
import type { CustomMatcher } from 'aws-sdk-client-mock-vitest';
import { expect, vi } from 'vitest';

expect.extend({ toReceiveCommandWith });

// Mock console methods to prevent output during tests
vi.spyOn(console, 'error').mockReturnValue();
vi.spyOn(console, 'warn').mockReturnValue();
vi.spyOn(console, 'debug').mockReturnValue();
vi.spyOn(console, 'info').mockReturnValue();
vi.spyOn(console, 'log').mockReturnValue();

declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: vitest typings expect an any type
  interface Assertion<T = any> extends CustomMatcher<T> {}
  interface AsymmetricMatchersContaining extends CustomMatcher {}
}

// Set up environment variables for testing
process.env._X_AMZN_TRACE_ID = '1-abcdef12-3456abcdef123456abcdef12';
process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
process.env.AWS_EXECUTION_ENV = 'nodejs20.x';
process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '128';
if (
  process.env.AWS_REGION === undefined &&
  process.env.CDK_DEFAULT_REGION === undefined
) {
  process.env.AWS_REGION = 'eu-west-1';
}
process.env._HANDLER = 'index.handler';
