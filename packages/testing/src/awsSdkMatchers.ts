import type { MetadataBearer } from '@smithy/types';
import type { AwsCommand, AwsStub } from 'aws-sdk-client-mock';
import { expect, type MatcherResult, type MatcherState } from 'vitest';

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

/**
 * Matches recorded AWS SDK command inputs using Vitest's partial object matching.
 *
 * @param received - The mocked AWS SDK client
 * @param command - The AWS SDK command constructor
 * @param expected - The expected subset of the command input
 */
function toReceiveCommandWith<
  Input extends object,
  Output extends MetadataBearer,
>(
  this: MatcherState,
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
}

export type { AwsSdkMatchers };
export { toReceiveCommandWith };
