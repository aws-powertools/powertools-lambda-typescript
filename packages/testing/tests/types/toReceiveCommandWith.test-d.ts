import { DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { expect, expectTypeOf, it } from 'vitest';
import type { CommandMatcher } from '../../src/toReceiveCommandWith.js';
import '../../src/setupEnv.js';

it('infers the expected input from the command constructor', () => {
  // Prepare
  const assertion = expect({});

  // Act & Assess
  expectTypeOf(assertion).toExtend<CommandMatcher>();
  expectTypeOf(
    assertion.toReceiveCommandWith(DescribeStacksCommand, {
      StackName: 'stack',
    })
  ).toBeVoid();
  assertion.toReceiveCommandWith(DescribeStacksCommand, {});
  assertion.toReceiveCommandWith(DescribeStacksCommand, {
    StackName: expect.any(String),
  });
  assertion.toReceiveCommandWith(DescribeStacksCommand, {
    // @ts-expect-error StackName must be a string
    StackName: 123,
  });
  assertion.toReceiveCommandWith(DescribeStacksCommand, {
    // @ts-expect-error UnknownField is not a DescribeStacks input
    UnknownField: 'value',
  });
});
