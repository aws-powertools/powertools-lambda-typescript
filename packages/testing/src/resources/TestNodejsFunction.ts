import { randomUUID } from 'node:crypto';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Alias, type CfnFunction, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { TEST_ARCHITECTURES, TEST_RUNTIMES } from '../constants.js';
import {
  concatenateResourceName,
  getArchitectureKey,
  getRuntimeKey,
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
    const isESM = extraProps.outputFormat === 'ESM';
    const { shouldPolyfillRequire = false } = extraProps;
    if (extraProps.lmi && extraProps.createAlias) {
      throw new Error('lmi and createAlias are mutually exclusive');
    }
    const { bundling, ...restProps } = props;
    const functionName = concatenateResourceName({
      testName: stack.testName,
      resourceName: extraProps.nameSuffix,
    });
    const resourceId = randomUUID().substring(0, 5);

    const logGroup = new LogGroup(stack.stack, `log-${resourceId}`, {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: RetentionDays.ONE_DAY,
    });
    super(stack.stack, `fn-${resourceId}`, {
      timeout: Duration.seconds(30),
      // Lambda Managed Instance functions require at least 2048 MB
      memorySize: extraProps.lmi ? 2048 : 512,
      tracing: Tracing.ACTIVE,
      bundling: {
        ...bundling,
        minify: true,
        mainFields: isESM ? ['module', 'main'] : ['main', 'module'],
        sourceMap: false,
        format: isESM ? OutputFormat.ESM : OutputFormat.CJS,
        banner: shouldPolyfillRequire
          ? `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
          : '',
      },
      ...restProps,
      functionName,
      runtime: TEST_RUNTIMES[getRuntimeKey()],
      architecture: TEST_ARCHITECTURES[getArchitectureKey()],
      logGroup,
    });

    let outputValue = this.functionName;
    if (extraProps.lmi) {
      this.#attachToCapacityProvider(extraProps.lmi);
      // LMI serves the $LATEST.PUBLISHED version, so invocations must target it
      outputValue = `${this.functionName}:$LATEST.PUBLISHED`;
    }
    if (extraProps.createAlias) {
      const dev = new Alias(this, 'dev', {
        aliasName: 'dev',
        version: this.currentVersion,
        provisionedConcurrentExecutions: 1,
      });
      outputValue = dev.functionArn;
    }

    new CfnOutput(this, extraProps.nameSuffix, {
      value: outputValue,
    });
  }

  /**
   * Associate this function with a Lambda Managed Instances capacity provider,
   * given either an in-stack construct or the ARN of one in another stack.
   */
  #attachToCapacityProvider(lmi: NonNullable<ExtraTestProps['lmi']>): void {
    const { capacityProvider, ...scaling } = lmi;
    if (typeof capacityProvider === 'string') {
      this.#attachToCapacityProviderArn(capacityProvider, scaling);
    } else {
      const {
        perExecutionEnvironmentMaxConcurrency,
        executionEnvironmentMemoryGiBPerVCpu,
        minExecutionEnvironments,
        maxExecutionEnvironments,
      } = scaling;
      capacityProvider.addFunction(this, {
        perExecutionEnvironmentMaxConcurrency,
        executionEnvironmentMemoryGiBPerVCpu,
        ...(minExecutionEnvironments !== undefined ||
        maxExecutionEnvironments !== undefined
          ? {
              latestPublishedScalingConfig: {
                minExecutionEnvironments,
                maxExecutionEnvironments,
              },
            }
          : {}),
      });
    }
  }

  /**
   * A capacity provider from another stack can only be referenced by ARN, and
   * the imported construct has no `addFunction`, so set the equivalent L1
   * properties directly.
   */
  #attachToCapacityProviderArn(
    capacityProviderArn: string,
    scaling: Omit<NonNullable<ExtraTestProps['lmi']>, 'capacityProvider'>
  ): void {
    const {
      perExecutionEnvironmentMaxConcurrency,
      executionEnvironmentMemoryGiBPerVCpu,
      minExecutionEnvironments,
      maxExecutionEnvironments,
    } = scaling;
    const cfnFunction = this.node.defaultChild as CfnFunction;
    cfnFunction.publishToLatestPublished = true;
    cfnFunction.capacityProviderConfig = {
      lambdaManagedInstancesCapacityProviderConfig: {
        capacityProviderArn,
        perExecutionEnvironmentMaxConcurrency,
        executionEnvironmentMemoryGiBPerVCpu,
      },
    };
    if (
      minExecutionEnvironments !== undefined ||
      maxExecutionEnvironments !== undefined
    ) {
      cfnFunction.functionScalingConfig = {
        minExecutionEnvironments,
        maxExecutionEnvironments,
      };
    }
  }
}

export { TestNodejsFunction };
