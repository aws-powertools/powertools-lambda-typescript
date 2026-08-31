import { App, Stack } from 'aws-cdk-lib';
import { describe, expect, it } from 'vitest';
import { TestStack } from '../../src/TestStack.js';

const serviceTag = {
  Service: 'Powertools-for-AWS-e2e-tests',
};

describe('TestStack', () => {
  it('tags an internally created stack', () => {
    const testStack = new TestStack({
      stackNameProps: {
        stackNamePrefix: 'TEST',
        testName: 'internal-stack',
      },
    });

    const artifact = testStack.app
      .synth()
      .getStackArtifact(testStack.stack.artifactId);

    expect(artifact.tags).toMatchObject(serviceTag);
  });

  it('tags a caller-supplied stack', () => {
    const app = new App();
    const stack = new Stack(app, 'CallerSuppliedStack');
    const testStack = new TestStack({
      app,
      stack,
      stackNameProps: {
        stackNamePrefix: 'TEST',
        testName: 'supplied-stack',
      },
    });

    const artifact = app.synth().getStackArtifact(testStack.stack.artifactId);

    expect(artifact.tags).toMatchObject(serviceTag);
  });
});
