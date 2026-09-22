import type { MatchersObject, Mock } from 'vitest';

/**
 * Describes the Metrics matchers available in test assertions.
 */
interface MetricsMatchers {
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
  toHaveEmittedNthEMFWith(nth: number, expected: Record<string, unknown>): void;
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

const metricsMatchers = {
  toHaveEmittedEMFWith(received: Mock, expected: Record<string, unknown>) {
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
  toHaveEmittedNthEMFWith(
    received: Mock,
    nth: number,
    expected: Record<string, unknown>
  ) {
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
  toHaveEmittedMetricWith(received: Mock, expected: Record<string, unknown>) {
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
  toHaveEmittedNthMetricWith(
    received: Mock,
    nth: number,
    expected: Record<string, unknown>
  ) {
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
} satisfies MatchersObject;

export { type MetricsMatchers, metricsMatchers };
