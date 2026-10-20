import { App, Stack } from 'aws-cdk-lib';
import { describe, expect, it } from 'vitest';
import { TestStack } from '../../src/TestStack.js';

const serviceTag = {
  Service: 'Powertools-for-AWS-e2e-tests',
};

describe('TestStack', () => {
  it.each([
    {
      stackType: 'an internally created stack',
      prepareStack: () => ({}),
    },
    {
      stackType: 'a caller-supplied stack',
      prepareStack: () => {
        const app = new App();
        return { app, stack: new Stack(app, 'CallerSuppliedStack') };
      },
    },
  ])('tags $stackType', ({ prepareStack }) => {
    // Prepare
    const stack = prepareStack();

    // Act
    const testStack = new TestStack({
      ...stack,
      stackNameProps: {
        stackNamePrefix: 'TEST',
        testName: 'tagged-stack',
      },
    });
    const artifact = testStack.app
      .synth()
      .getStackArtifact(testStack.stack.artifactId);

    // Assess
    expect(artifact.tags).toMatchObject(serviceTag);
  });
});
