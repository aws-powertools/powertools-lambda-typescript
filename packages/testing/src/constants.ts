import { Runtime } from 'aws-cdk-lib/aws-lambda';

/**
 * The default AWS Lambda runtime to use when none is provided.
 */
const defaultRuntime = 'nodejs18x';

/**
 * The AWS Lambda runtimes that are supported by the project.
 */
const TEST_RUNTIMES = {
  nodejs16x: Runtime.NODEJS_16_X,
  [defaultRuntime]: Runtime.NODEJS_18_X,
} as const;

export { TEST_RUNTIMES, defaultRuntime };
