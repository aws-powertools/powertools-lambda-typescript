import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import '../../src/patchToolkitLib.js';

const require = createRequire(import.meta.url);
const toolkitLibDir = dirname(
  require.resolve('@aws-cdk/toolkit-lib/package.json')
);
const cfnApi = require(join(toolkitLibDir, 'lib/api/deployments/cfn-api.js'));
const { CloudFormationStack } = require(
  join(toolkitLibDir, 'lib/api/cloudformation/stack-helpers.js')
);

const ioHelper = {
  defaults: {
    debug: vi.fn().mockResolvedValue(undefined),
  },
};

const stackDescription = (status: string) => ({
  Stacks: [
    {
      StackName: 'MyStack',
      StackId: 'arn:aws:cloudformation:eu-west-1:123456789012:stack/MyStack/x',
      StackStatus: status,
      CreationTime: new Date(),
    },
  ],
});

describe('patchToolkitLib', () => {
  it('retries stabilization when a stale read reports REVIEW_IN_PROGRESS mid-deploy', async () => {
    const describeStacks = vi
      .fn()
      .mockResolvedValueOnce(stackDescription('CREATE_IN_PROGRESS'))
      .mockResolvedValueOnce(stackDescription('REVIEW_IN_PROGRESS'))
      .mockResolvedValueOnce(stackDescription('CREATE_COMPLETE'));

    const stack = await cfnApi.waitForStackDeploy(
      { describeStacks },
      ioHelper,
      'MyStack',
      1
    );

    expect(describeStacks).toHaveBeenCalledTimes(3);
    expect(stack.stackStatus.name).toBe('CREATE_COMPLETE');
  });

  it('gives up after exhausting stale-read retries', async () => {
    const describeStacks = vi
      .fn()
      .mockResolvedValue(stackDescription('REVIEW_IN_PROGRESS'));

    await expect(
      cfnApi.waitForStackDeploy({ describeStacks }, ioHelper, 'MyStack', 1)
    ).rejects.toThrow('REVIEW_IN_PROGRESS');

    expect(describeStacks).toHaveBeenCalledTimes(6);
  });

  it('propagates genuine deployment failures without retrying', async () => {
    const describeStacks = vi
      .fn()
      .mockResolvedValue(stackDescription('ROLLBACK_COMPLETE'));

    await expect(
      cfnApi.waitForStackDeploy({ describeStacks }, ioHelper, 'MyStack', 1)
    ).rejects.toThrow('failed creation');

    expect(describeStacks).toHaveBeenCalledTimes(1);
  });

  it('returns an empty description instead of throwing NoStack for a fresh stack', () => {
    const stack = CloudFormationStack.doesNotExist({}, 'MyStack');

    expect(stack.wrapped).toEqual({});
  });
});
