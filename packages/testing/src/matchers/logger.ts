import type { MatchersObject, Mock } from 'vitest';

/**
 * Describes the Logger matchers available in test assertions.
 */
interface LoggerMatchers {
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
}

const loggerMatchers = {
  toHaveLogged(received: Mock, expected: Record<string, unknown>) {
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
  toHaveLoggedNth(
    received: Mock,
    nth: number,
    expected: Record<string, unknown>
  ) {
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
} satisfies MatchersObject;

export { type LoggerMatchers, loggerMatchers };
