import { randomUUID } from 'node:crypto';
import { Arn, ArnFormat, CfnOutput, Duration, Stack } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Alias, Tracing } from 'aws-cdk-lib/aws-lambda';
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
      memorySize: 512,
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
}

/**
 * A NodejsFunction with durable execution enabled for testing durable functions.
 *
 * Durable functions require:
 * - durableConfig with executionTimeout
 * - IAM permissions for checkpointing
 * - A published version or alias (qualified ARN)
 */
class TestNodejsDurableFunction extends NodejsFunction {
  public constructor(
    stack: TestStack,
    props: TestNodejsFunctionProps,
    extraProps: ExtraTestProps
  ) {
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
      memorySize: 512,
      tracing: Tracing.ACTIVE,
      bundling: {
        ...bundling,
        minify: true,
        mainFields: ['module', 'main'],
        sourceMap: false,
        format: OutputFormat.ESM,
        banner: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
      },
      ...restProps,
      functionName,
      runtime: TEST_RUNTIMES[getRuntimeKey()],
      architecture: TEST_ARCHITECTURES[getArchitectureKey()],
      logGroup,
      durableConfig: {
        executionTimeout: Duration.minutes(5),
        retentionPeriod: Duration.days(1),
      },
    });

    // Durable functions need checkpoint permissions - use constructed ARN to avoid circular dependency
    const functionArn = Arn.format(
      {
        service: 'lambda',
        resource: 'function',
        resourceName: functionName,
        arnFormat: ArnFormat.COLON_RESOURCE_NAME,
      },
      Stack.of(stack.stack)
    );
    this.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'lambda:CheckpointDurableExecutions',
          'lambda:GetDurableExecutionState',
        ],
        resources: [functionArn, `${functionArn}:*`],
      })
    );

    // Durable functions require a qualified ARN (version or alias)
    const alias = new Alias(this, 'live', {
      aliasName: 'live',
      version: this.currentVersion,
    });

    new CfnOutput(this, extraProps.nameSuffix, {
      value: alias.functionName,
    });
  }
}

export { TestNodejsFunction, TestNodejsDurableFunction };
