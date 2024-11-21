import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

/**
 * The default AWS Lambda runtime to use when none is provided.
 */
const defaultRuntime = 'nodejs22x';

/**
 * The AWS Lambda runtimes that are supported by the project.
 */
const TEST_RUNTIMES = {
  nodejs18x: Runtime.NODEJS_18_X,
  nodejs20x: Runtime.NODEJS_20_X,
  [defaultRuntime]: Runtime.NODEJS_22_X,
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

/**
 * Log level. used for filtering the log
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export {
  TEST_RUNTIMES,
  defaultRuntime,
  TEST_ARCHITECTURES,
  defaultArchitecture,
  LogLevel,
};
