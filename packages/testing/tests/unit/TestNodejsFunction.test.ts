import { join } from 'node:path';
import { Duration } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { TestNodejsFunction } from '../../src/resources/TestNodejsFunction.js';
import { TestStack } from '../../src/TestStack.js';

describe('TestNodejsFunction', () => {
  it('acknowledges the replacement info of a durable function', () => {
    // Prepare
    const testStack = new TestStack({
      stackNameProps: {
        stackNamePrefix: 'TEST',
        testName: 'durable-function',
      },
    });

    // Act
    new TestNodejsFunction(
      testStack,
      {
        entry: join(__dirname, '../../src/context.ts'),
        durableConfig: {
          executionTimeout: Duration.minutes(5),
          retentionPeriod: Duration.days(1),
        },
      },
      { nameSuffix: 'durable' }
    );

    // Assess
    expect(
      Annotations.fromStack(testStack.stack).findInfo(
        '*',
        Match.stringLikeRegexp('use durability')
      )
    ).toHaveLength(0);
  });
});
