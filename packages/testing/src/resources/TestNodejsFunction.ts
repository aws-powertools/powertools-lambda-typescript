import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  BundlingOptions,
  OutputFormat,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { randomUUID } from 'node:crypto';
import { TEST_RUNTIMES, TEST_ARCHITECTURES } from '../constants.js';
import {
  concatenateResourceName,
  getRuntimeKey,
  getArchitectureKey,
} from '../helpers.js';
import type { TestStack } from '../TestStack.js';
import type { ExtraTestProps, TestNodejsFunctionProps } from '../types.js';

/**
 * A NodejsFunction that can be used in tests.
 *
 * It includes some default props and outputs the function name.
 */
class TestNodejsFunction extends NodejsFunction {
  public constructor(
    stack: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
    const isESM = extraProps.outputFormat === 'ESM' ? true : false;
    const bundling: BundlingOptions = {
      minify: true,
      mainFields: isESM ? ['module', 'main'] : ['main', 'module'],
      sourceMap: true,
      format: isESM ? OutputFormat.ESM : OutputFormat.CJS,
      banner: isESM
        ? `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
        : '',
    };

    super(stack.stack, `fn-${randomUUID().substring(0, 5)}`, {
      timeout: Duration.seconds(30),
      memorySize: 256,
      tracing: Tracing.ACTIVE,
      ...props,
      functionName: concatenateResourceName({
        testName: stack.testName,
        resourceName: extraProps.nameSuffix,
      }),
      runtime: TEST_RUNTIMES[getRuntimeKey()],
      architecture: TEST_ARCHITECTURES[getArchitectureKey()],
      logRetention: RetentionDays.ONE_DAY,
      bundling,
    });

    new CfnOutput(this, extraProps.nameSuffix, {
      value: this.functionName,
    });
  }
}

export { TestNodejsFunction };
