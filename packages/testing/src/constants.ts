import { Runtime, Architecture, RuntimeFamily } from 'aws-cdk-lib/aws-lambda';

/**
 * The default AWS Lambda runtime to use when none is provided.
 */
const defaultRuntime = 'nodejs20x';

/**
 * The AWS Lambda runtimes that are supported by the project.
 */
const TEST_RUNTIMES = {
  nodejs14x: Runtime.NODEJS_14_X,
  nodejs16x: Runtime.NODEJS_16_X,
  nodejs18x: Runtime.NODEJS_18_X,
  // TODO: address when working on #1664: replace with `Runtime.NODEJS_20_X`
  [defaultRuntime]: new Runtime('nodejs20.x', RuntimeFamily.NODEJS),
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
