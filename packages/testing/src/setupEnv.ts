import type { MetadataBearer } from '@smithy/types';
import type { AwsCommand, AwsStub } from 'aws-sdk-client-mock';
import { expect, type MatcherResult, vi } from 'vitest';

// Mock console methods to prevent output during tests
vi.spyOn(console, 'error').mockReturnValue();
vi.spyOn(console, 'warn').mockReturnValue();
vi.spyOn(console, 'debug').mockReturnValue();
vi.spyOn(console, 'info').mockReturnValue();
vi.spyOn(console, 'log').mockReturnValue();

expect.extend({
  /**
   * Matches recorded AWS SDK command inputs using Vitest's partial object matching.
   *
   * @param received - The mocked AWS SDK client
   * @param command - The AWS SDK command constructor
   * @param expected - The expected subset of the command input
   */
  toReceiveCommandWith<Input extends object, Output extends MetadataBearer>(
    received: AwsStub<Input, Output, unknown>,
    command: new (input: Input) => AwsCommand<Input, Output>,
    expected: Partial<Input>
  ): MatcherResult {
    const inputs = received
      .commandCalls(command)
      .map((call) => call.args[0].input);
    const pass = inputs.some((input) =>
      this.equals(input, expect.objectContaining<object>(expected))
    );

    return {
      pass,
      message: () =>
        `Expected ${received.clientName()} ${command.name} ${this.isNot ? 'not ' : ''}to receive input containing ${this.utils.printExpected(expected)}\nReceived inputs (call count: ${inputs.length}): ${this.utils.printReceived(inputs)}`,
      actual: inputs,
      expected,
    };
  },
  toHaveLogged(received, expected) {
    const calls = received.mock.calls;
    const messages = new Array(calls.length);
    for (const [idx, call] of calls.entries()) {
      const [rawMessage] = call;
      try {
        messages[idx] = JSON.parse(rawMessage);
      } catch {
        messages[idx] = rawMessage;
      }
      if (this.equals(messages[idx], expected)) {
        return {
          message: () => '',
          pass: true,
        };
      }
    }

    return {
      message: () => 'Expected function to have logged provided object',
      pass: false,
      actual: messages,
      expected,
    };
  },
  toHaveEmittedEMFWith(received, expected) {
    const calls = received.mock.calls;
    const messages = new Array(calls.length);
    if (calls.length === 0) {
      return {
        message: () =>
          'Expected function to have emitted EMF with provided object',
        pass: false,
        actual: 'No EMF emitted',
        expected,
      };
    }
    for (const [idx, call] of calls.entries()) {
      const [rawMessage] = call;
      try {
        messages[idx] = JSON.parse(rawMessage);
      } catch {
        messages[idx] = rawMessage;
      }
      if (this.equals(messages[idx], expected)) {
        return {
          message: () => '',
          pass: true,
        };
      }
    }

    return {
      message: () =>
        'Expected function to have emitted EMF with provided object',
      pass: false,
      actual: messages,
      expected,
    };
  },
  toHaveEmittedNthEMFWith(received, nth, expected) {
    const call = received.mock.calls[nth - 1];
    if (!call) {
      return {
        message: () =>
          `Expected function to have emitted EMF with provided object during ${nth} call`,
        pass: false,
        actual: 'No EMF found at index',
        expected,
      };
    }
    const [rawMessage] = call;

    const message = JSON.parse(rawMessage);
    if (this.equals(message, expected)) {
      return {
        message: () => '',
        pass: true,
      };
    }

    return {
      message: () =>
        'Expected function to have emitted EMF with provided object',
      pass: false,
      actual: message,
      expected,
    };
  },
  toHaveEmittedMetricWith(received, expected) {
    const calls = received.mock.calls;
    const emfs = [];
    if (calls.length === 0) {
      return {
        message: () =>
          'Expected function to have emitted metric with provided object',
        pass: false,
        actual: 'No metric emitted',
        expected,
      };
    }
    for (const [idx, call] of calls.entries()) {
      const [rawMessage] = call;
      try {
        emfs[idx] = JSON.parse(rawMessage);
      } catch {
        emfs[idx] = rawMessage;
      }
      const metrics = emfs[idx]._aws.CloudWatchMetrics;
      if (metrics) {
        for (const metric of metrics) {
          if (this.equals(metric, expected)) {
            return {
              message: () => '',
              pass: true,
            };
          }
        }
      }
    }

    return {
      message: () =>
        'Expected function to have emitted metric with provided object',
      pass: false,
      actual: emfs,
      expected,
    };
  },
  toHaveEmittedNthMetricWith(received, nth, expected) {
    const call = received.mock.calls[nth - 1];
    if (!call) {
      return {
        message: () =>
          `Expected function to have emitted metric with provided object during ${nth} call`,
        pass: false,
        actual: 'No metric found at index',
        expected,
      };
    }
    const [rawMessage] = call;
    const message = JSON.parse(rawMessage);
    const metrics = message._aws.CloudWatchMetrics;
    if (metrics) {
      for (const metric of metrics) {
        if (this.equals(metric, expected)) {
          return {
            message: () => '',
            pass: true,
          };
        }
      }
    }

    return {
      message: () =>
        'Expected function to have emitted metric with provided object',
      pass: false,
      actual: message,
      expected,
    };
  },
  toHaveLoggedNth(received, nth, expected) {
    const call = received.mock.calls[nth - 1];
    if (!call) {
      return {
        message: () =>
          `Expected function to have logged provided object during ${nth} call`,
        pass: false,
        actual: 'No log found at index',
        expected,
      };
    }
    const [rawMessage] = call;
    const message = JSON.parse(rawMessage);
    if (this.equals(message, expected)) {
      return {
        message: () => '',
        pass: true,
      };
    }

    return {
      message: () => 'Expected function to have logged provided object',
      pass: false,
      actual: message,
      expected,
    };
  },
});

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

/**
 * Describes the AWS SDK matchers available in test assertions.
 */
interface AwsSdkMatchers {
  /**
   * Asserts that at least one call to the command contains the expected input.
   *
   * @param command - The AWS SDK command constructor
   * @param expected - The expected subset of the command input
   */
  toReceiveCommandWith<Input extends object, Output extends MetadataBearer>(
    command: new (input: Input) => AwsCommand<Input, Output>,
    expected: Partial<NoInfer<Input>>
  ): void;
}

declare module 'vitest' {
  interface Assertion<R, T> extends AwsSdkMatchers {
    /**
     * Asserts that the logger function has been called with the expected log message
     * during any call.
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'info').mockReturnValue();
     *
     * expect(console.info).toHaveLogged(
     *   expect.objectContaining({
     *     message: 'Hello, world!',
     *   })
     * );
     * ```
     *
     * @param expected - The expected log message
     */
    toHaveLogged(expected: Record<string, unknown>): void;
    /**
     * Asserts that the logger function has been called with the expected log message
     * during the specific nth call.
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'info').mockReturnValue();
     *
     * expect(console.info).toHaveLoggedNth(
     *   1,
     *   expect.objectContaining({
     *     message: 'Hello, world!',
     *   })
     * );
     * ```
     *
     * @param nth - The index of the call to check
     * @param expected - The expected log message
     */
    toHaveLoggedNth(nth: number, expected: Record<string, unknown>): void;
    /**
     * Asserts that the function has emitted the expected EMF blob
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'log').mockReturnValue();
     *
     * expect(console.log).toHaveEmittedEMFWith(
     *   expect.objectContaining({
     *     service: 'Hello, world!',
     *   })
     * );
     * ```
     *
     * @param expected - The expected EMF message
     */
    toHaveEmittedEMFWith(expected: Record<string, unknown>): void;
    /**
     * Asserts that the function has emitted the expected EMF blob
     * during the specific nth call.
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'log').mockReturnValue();
     *
     * expect(console.log).toHaveEmittedNthEMFWith(
     *   1,
     *   expect.objectContaining({
     *     service: 'Hello, world!',
     *   })
     * );
     * ```
     *
     * @param nth - The index of the call to check
     * @param expected - The expected EMF message
     */
    toHaveEmittedNthEMFWith(
      nth: number,
      expected: Record<string, unknown>
    ): void;
    /**
     * Asserts that the function has emitted the expected metric
     *
     * A metric is the object within the `_aws.CloudWatchMetrics` key
     * of the emitted EMF blob.
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'log').mockReturnValue();
     *
     * expect(console.log).toHaveEmittedMetricWith(
     *   expect.objectContaining({
     *     service: 'Hello, world!',
     *   })
     * );
     * ```
     *
     * @param expected - The expected metric
     */
    toHaveEmittedMetricWith(expected: Record<string, unknown>): void;
    /**
     * Asserts that the function has emitted the expected metric
     * during the specific nth call.
     *
     * A metric is the object within the `_aws.CloudWatchMetrics` key
     * of the emitted EMF blob.
     *
     * @example
     * ```ts
     * vi.spyOn(console, 'log').mockReturnValue();
     *
     * expect(console.log).toHaveEmittedNthMetricWith(
     *  1,
     *  expect.objectContaining({
     *   service: 'Hello, world!',
     *  })
     * );
     * ```
     *
     * @param nth - The index of the call to check
     * @param expected - The expected metric
     */
    toHaveEmittedNthMetricWith(
      nth: number,
      expected: Record<string, unknown>
    ): void;
  }
  interface AsymmetricMatchersContaining extends AwsSdkMatchers {}
}

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
