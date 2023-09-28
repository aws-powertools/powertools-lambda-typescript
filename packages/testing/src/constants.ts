import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';

/**
 * The default AWS Lambda runtime to use when none is provided.
 */
const defaultRuntime = 'nodejs18x';

/**
 * The AWS Lambda runtimes that are supported by the project.
 */
const TEST_RUNTIMES = {
  nodejs14x: Runtime.NODEJS_14_X,
  nodejs16x: Runtime.NODEJS_16_X,
  [defaultRuntime]: Runtime.NODEJS_18_X,
} as const;

/**
 * The default AWS Lambda architecture to use when none is provided.
 */
const defaultArchitecture = 'x86_64';

/**
 * The AWS Lambda architectures that are supported by the project.
 */
const TEST_ARCHITECTURES = {
  [defaultArchitecture]: Architecture.X86_64,
  arm64: Architecture.ARM_64,
} as const;

export {
  TEST_RUNTIMES,
  defaultRuntime,
  TEST_ARCHITECTURES,
  defaultArchitecture,
};
