import { join } from 'node:path';
import { Template } from 'aws-cdk-lib/assertions';
import { afterEach, describe, it, vi } from 'vitest';
import { TestNodejsFunction } from '../../src/resources/TestNodejsFunction.js';
import { TestStack } from '../../src/TestStack.js';

describe('TestNodejsFunction', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    { architecture: 'x86_64', outputFormat: 'CJS' },
    { architecture: 'arm64', outputFormat: 'CJS' },
    { architecture: 'x86_64', outputFormat: 'ESM' },
    { architecture: 'arm64', outputFormat: 'ESM' },
  ] as const)(
    'bundles and synthesizes a Node.js 26 $outputFormat function on $architecture',
    ({ architecture, outputFormat }) => {
      // Prepare
      vi.stubEnv('RUNTIME', 'nodejs26x');
      vi.stubEnv('ARCH', architecture);
      const stack = new TestStack({
        stackNameProps: { stackNamePrefix: 'TEST', testName: 'Nodejs26' },
      });

      // Act
      new TestNodejsFunction(
        stack,
        {
          entry: join(
            import.meta.dirname,
            'TestNodejsFunction.test.functionCode.ts'
          ),
        },
        { nameSuffix: 'Greeting', outputFormat }
      );
      const template = Template.fromStack(stack.stack);

      // Assess
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs26.x',
        Architectures: [architecture],
        Handler: 'index.handler',
      });
    }
  );
});
